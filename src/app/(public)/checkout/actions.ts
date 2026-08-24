"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { calculateTieredPrice } from "@/lib/pricing";
import { buildIntegritySignature } from "@/lib/wompi";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp-message";
import { getWhatsAppNumber } from "@/lib/settings";
import { sendOrderReceivedEmail } from "@/lib/order-emails";

export type CartItemInput = { productId: string; quantity: number };

type ValidationError = { ok: false; error: string; invalidProductIds: string[] };

const INVALID_PRODUCTS_ERROR = "Uno o más productos ya no están disponibles y se quitaron de tu carrito.";
const INVALID_EMAIL_ERROR = "El correo no tiene un formato válido.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function validateAndPriceItems(
  cartItems: CartItemInput[]
): Promise<
  | { ok: true; lines: { productId: string; name: string; quantity: number; unitPriceCop: number }[]; totalCop: number }
  | { ok: false; invalidProductIds: string[] }
> {
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

  // A line whose quantity crosses tiers becomes multiple `lines` entries,
  // one per tier consumed (design spec section 4/5) — all sharing the same
  // productId, which order_items doesn't need a "tier" column to represent.
  const lines = cartItems.flatMap((i) => {
    const product = byId.get(i.productId)!;
    const { breakdown } = calculateTieredPrice(
      {
        unitPriceCop: product.unit_price_cop,
        pack1Qty: product.pack1_qty,
        pack1PriceCop: product.pack1_price_cop,
        pack2Qty: product.pack2_qty,
        pack2PriceCop: product.pack2_price_cop,
      },
      i.quantity
    );
    return breakdown.map((line) => ({
      productId: i.productId,
      name: product.name,
      quantity: line.quantity,
      unitPriceCop: line.unitPriceCop,
    }));
  });
  const totalCop = lines.reduce((sum, l) => sum + l.unitPriceCop * l.quantity, 0);
  return { ok: true, lines, totalCop };
}

export type WompiOrderResult =
  | { ok: true; orderId: string; orderNumber: number; reference: string; amountInCents: number; currency: string; signature: string; publicKey: string }
  | ValidationError;

export async function createWompiOrder(
  customer: { name: string; phone: string; email: string; address: string; neighborhood: string; city: string; extra?: string },
  cartItems: CartItemInput[]
): Promise<WompiOrderResult> {
  if (!EMAIL_PATTERN.test(customer.email)) return { ok: false, error: INVALID_EMAIL_ERROR, invalidProductIds: [] };

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

  const { error: itemsError } = await supabase.from("order_items").insert(
    priced.lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      quantity: l.quantity,
      unit_price_cop: l.unitPriceCop,
    }))
  );
  if (itemsError) throw itemsError;

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

  const { error: itemsError } = await supabase.from("order_items").insert(
    priced.lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      quantity: l.quantity,
      unit_price_cop: l.unitPriceCop,
    }))
  );
  if (itemsError) throw itemsError;

  try {
    await sendOrderReceivedEmail({
      customerName: customer.name,
      customerEmail: customer.email,
      orderNumber: order.order_number,
      items: priced.lines,
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
    items: priced.lines,
    totalCop: priced.totalCop,
    address: customer.address,
    neighborhood: customer.neighborhood,
    city: customer.city,
    extra: customer.extra,
  });

  return { ok: true, orderId: order.id, orderNumber: order.order_number, whatsappUrl: buildWhatsAppUrl(whatsappNumber, message) };
}
