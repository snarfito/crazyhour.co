"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { calculateTieredPrice } from "@/lib/pricing";
import { resolveProductSelection, type AttributeForSelection, type OptionForSelection } from "@/lib/product-attributes";
import { buildIntegritySignature } from "@/lib/wompi";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp-message";
import { getWhatsAppNumber } from "@/lib/settings";
import { sendOrderReceivedEmail } from "@/lib/order-emails";
import { isValidCOPhone } from "@/lib/phone";
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- this project has no generated Supabase types
type AnySupabaseClient = any;

export type CartItemInput = { productId: string; quantity: number; selectedOptionIds?: string[] };

type ValidationError = { ok: false; error: string; invalidProductIds: string[] };

type PricedLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCop: number;
  selectedAttributeSummary: string | null;
  selections: { optionId: string; attributeDisplayName: string; optionDisplayName: string }[];
};

const INVALID_PRODUCTS_ERROR = "Uno o más productos ya no están disponibles y se quitaron de tu carrito.";
const INVALID_EMAIL_ERROR = "El correo no tiene un formato válido.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_PHONE_ERROR = "El teléfono debe ser un celular colombiano válido (10 dígitos, empieza en 3).";

async function validateAndPriceItems(
  cartItems: CartItemInput[]
): Promise<{ ok: true; lines: PricedLine[]; totalCop: number } | { ok: false; invalidProductIds: string[] }> {
  if (cartItems.length === 0) return { ok: false, invalidProductIds: [] };

  const badQuantityIds = cartItems
    .filter((i) => !Number.isInteger(i.quantity) || i.quantity <= 0)
    .map((i) => i.productId);
  if (badQuantityIds.length > 0) return { ok: false, invalidProductIds: badQuantityIds };

  const supabase = createServiceClient();
  const ids = cartItems.map((i) => i.productId);
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, unit_price_cop, pack1_qty, pack1_price_cop, pack2_qty, pack2_price_cop, is_active")
    .in("id", ids);
  if (error) throw error;

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const invalidProductIds = cartItems
    .filter((i) => !byId.get(i.productId)?.is_active)
    .map((i) => i.productId);

  if (invalidProductIds.length > 0) {
    return { ok: false, invalidProductIds };
  }

  // Grupos de variantes por producto (color, talla, ...) — un producto sin
  // filas aquí se comporta exactamente como antes de esta funcionalidad.
  const { data: attributeRows, error: attrError } = await supabase
    .from("product_attributes")
    .select(
      "id, product_id, display_name, affects_price, attribute_options(id, display_name, unit_price_cop, pack1_price_cop, pack2_price_cop, is_active)"
    )
    .in("product_id", ids);
  if (attrError) throw attrError;

  const attributesByProduct = new Map<string, AttributeForSelection[]>();
  const optionsByProduct = new Map<string, OptionForSelection[]>();
  for (const row of attributeRows ?? []) {
    const attributes = attributesByProduct.get(row.product_id) ?? [];
    attributes.push({ id: row.id, displayName: row.display_name, affectsPrice: row.affects_price });
    attributesByProduct.set(row.product_id, attributes);

    const options = optionsByProduct.get(row.product_id) ?? [];
    for (const opt of (row.attribute_options ?? []) as {
      id: string;
      display_name: string;
      unit_price_cop: number | null;
      pack1_price_cop: number | null;
      pack2_price_cop: number | null;
      is_active: boolean;
    }[]) {
      if (!opt.is_active) continue; // opción deshabilitada por el admin: no se puede seleccionar
      options.push({
        id: opt.id,
        attributeId: row.id,
        displayName: opt.display_name,
        unitPriceCop: opt.unit_price_cop,
        pack1PriceCop: opt.pack1_price_cop,
        pack2PriceCop: opt.pack2_price_cop,
      });
    }
    optionsByProduct.set(row.product_id, options);
  }

  const invalidSelectionIds: string[] = [];
  const lines: PricedLine[] = [];

  for (const item of cartItems) {
    const product = byId.get(item.productId)!;
    const attributes = attributesByProduct.get(item.productId) ?? [];
    const options = optionsByProduct.get(item.productId) ?? [];
    const resolved = resolveProductSelection(attributes, options, item.selectedOptionIds ?? []);
    if (!resolved.ok) {
      invalidSelectionIds.push(item.productId);
      continue;
    }

    // La CANTIDAD de cada escalón (pack1_qty/pack2_qty) es siempre la del
    // producto — es lo único compartido entre variantes (decisión
    // confirmada con el usuario, 26 ago). Cuando hay un grupo que afecta
    // precio, sus 3 precios (unidad/media paca/paca completa) reemplazan
    // POR COMPLETO los del producto — nunca se mezclan.
    const { unitPriceCop, pack1PriceCop, pack2PriceCop } = resolved.result.priceOverride ?? {
      unitPriceCop: product.unit_price_cop,
      pack1PriceCop: product.pack1_price_cop,
      pack2PriceCop: product.pack2_price_cop,
    };
    const { breakdown } = calculateTieredPrice(
      {
        unitPriceCop,
        pack1Qty: product.pack1_qty,
        pack1PriceCop,
        pack2Qty: product.pack2_qty,
        pack2PriceCop,
      },
      item.quantity
    );
    const name = resolved.result.summary ? `${product.name} — ${resolved.result.summary}` : product.name;

    for (const line of breakdown) {
      lines.push({
        productId: item.productId,
        name,
        quantity: line.quantity,
        unitPriceCop: line.unitPriceCop,
        selectedAttributeSummary: resolved.result.summary || null,
        selections: resolved.result.selections.map((s) => ({
          optionId: s.optionId,
          attributeDisplayName: s.attributeDisplayName,
          optionDisplayName: s.optionDisplayName,
        })),
      });
    }
  }

  if (invalidSelectionIds.length > 0) {
    return { ok: false, invalidProductIds: invalidSelectionIds };
  }

  const totalCop = lines.reduce((sum, l) => sum + l.unitPriceCop * l.quantity, 0);
  return { ok: true, lines, totalCop };
}

/** Inserta order_items y, para las líneas con variantes, sus order_item_selections. */
async function insertOrderItems(supabase: AnySupabaseClient, orderId: string, lines: PricedLine[]) {
  const { data: insertedItems, error: itemsError } = await supabase
    .from("order_items")
    .insert(
      lines.map((l) => ({
        order_id: orderId,
        product_id: l.productId,
        quantity: l.quantity,
        unit_price_cop: l.unitPriceCop,
        selected_attribute_summary: l.selectedAttributeSummary,
      }))
    )
    .select("id");
  if (itemsError) throw itemsError;

  const selectionRows = (insertedItems ?? []).flatMap(
    (item: { id: string }, i: number) =>
      lines[i].selections.map((s) => ({
        order_item_id: item.id,
        attribute_option_id: s.optionId,
        attribute_display_name: s.attributeDisplayName,
        option_display_name: s.optionDisplayName,
      }))
  );
  if (selectionRows.length > 0) {
    const { error: selectionsError } = await supabase.from("order_item_selections").insert(selectionRows);
    if (selectionsError) throw selectionsError;
  }
}

/** Forma minimal reusada por el email y el mensaje de WhatsApp — el nombre ya incluye el color/talla elegidos. */
function toMessageItems(lines: PricedLine[]) {
  return lines.map(({ productId, name, quantity, unitPriceCop }) => ({ productId, name, quantity, unitPriceCop }));
}

export type WompiOrderResult =
  | { ok: true; orderId: string; orderNumber: number; reference: string; amountInCents: number; currency: string; signature: string; publicKey: string }
  | ValidationError;

export async function createWompiOrder(
  customer: { name: string; phone: string; email: string; address: string; neighborhood: string; city: string; extra?: string },
  cartItems: CartItemInput[]
): Promise<WompiOrderResult> {
  if (!EMAIL_PATTERN.test(customer.email)) return { ok: false, error: INVALID_EMAIL_ERROR, invalidProductIds: [] };
  if (!isValidCOPhone(customer.phone)) return { ok: false, error: INVALID_PHONE_ERROR, invalidProductIds: [] };

  const priced = await validateAndPriceItems(cartItems);
  if (!priced.ok) return { ok: false, error: INVALID_PRODUCTS_ERROR, invalidProductIds: priced.invalidProductIds };

  const supabase = createServiceClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      channel: "wompi",
      status: "pending_wompi",
      total_cop: priced.totalCop,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      shipping_address: customer.address,
      shipping_neighborhood: customer.neighborhood,
      shipping_city: customer.city,
      shipping_extra: customer.extra || null,
    })
    .select("id, order_number")
    .single();
  if (orderError || !order) throw orderError ?? new Error("No se pudo crear el pedido.");

  await insertOrderItems(supabase, order.id, priced.lines);

  // No "order received" email here — a Wompi order isn't confirmed yet at
  // creation time (the widget hasn't even opened). The webhook sends it
  // once Wompi confirms the payment (see /api/webhooks/wompi/route.ts).

  const amountInCents = priced.totalCop * 100;
  const currency = "COP";
  const signature = buildIntegritySignature({ reference: order.id, amountInCents, currency });

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.order_number,
    reference: order.id,
    amountInCents,
    currency,
    signature,
    publicKey: process.env.WOMPI_PUBLIC_KEY!,
  };
}

export type WhatsAppOrderResult = { ok: true; orderId: string; orderNumber: number; whatsappUrl: string } | ValidationError;

export async function createWhatsAppOrder(
  customer: { name: string; phone: string; email: string; address: string; neighborhood: string; city: string; extra?: string },
  cartItems: CartItemInput[]
): Promise<WhatsAppOrderResult> {
  if (!EMAIL_PATTERN.test(customer.email)) return { ok: false, error: INVALID_EMAIL_ERROR, invalidProductIds: [] };
  if (!isValidCOPhone(customer.phone)) return { ok: false, error: INVALID_PHONE_ERROR, invalidProductIds: [] };

  const priced = await validateAndPriceItems(cartItems);
  if (!priced.ok) return { ok: false, error: INVALID_PRODUCTS_ERROR, invalidProductIds: priced.invalidProductIds };

  const supabase = createServiceClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      channel: "whatsapp",
      status: "pending_whatsapp",
      total_cop: priced.totalCop,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      shipping_address: customer.address,
      shipping_neighborhood: customer.neighborhood,
      shipping_city: customer.city,
      shipping_extra: customer.extra || null,
    })
    .select("id, order_number")
    .single();
  if (orderError || !order) throw orderError ?? new Error("No se pudo crear el pedido.");

  await insertOrderItems(supabase, order.id, priced.lines);

  try {
    await sendOrderReceivedEmail({
      customerName: customer.name,
      customerEmail: customer.email,
      orderNumber: order.order_number,
      items: toMessageItems(priced.lines),
      totalCop: priced.totalCop,
      address: customer.address,
      neighborhood: customer.neighborhood,
      city: customer.city,
      extra: customer.extra,
    });
  } catch (error) {
    console.error("[resend]", error);
  }

  const whatsappNumber = await getWhatsAppNumber();
  const message = buildWhatsAppMessage({
    customerName: customer.name,
    orderNumber: order.order_number,
    items: toMessageItems(priced.lines),
    totalCop: priced.totalCop,
    address: customer.address,
    neighborhood: customer.neighborhood,
    city: customer.city,
    extra: customer.extra,
  });

  return { ok: true, orderId: order.id, orderNumber: order.order_number, whatsappUrl: buildWhatsAppUrl(whatsappNumber, message) };
}
