"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { buildIntegritySignature } from "@/lib/wompi";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp-message";
import { getWhatsAppNumber } from "@/lib/settings";

export type CartItemInput = { productId: string; quantity: number };

type ValidationError = { ok: false; error: string; invalidProductIds: string[] };

const INVALID_PRODUCTS_ERROR = "Uno o más productos ya no están disponibles y se quitaron de tu carrito.";

async function validateAndPriceItems(
  cartItems: CartItemInput[]
): Promise<
  | { ok: true; items: { productId: string; name: string; quantity: number; unitPriceCop: number }[]; totalCop: number }
  | { ok: false; invalidProductIds: string[] }
> {
  if (cartItems.length === 0) return { ok: false, invalidProductIds: [] };

  const badQuantityIds = cartItems
    .filter((i) => !Number.isInteger(i.quantity) || i.quantity <= 0)
    .map((i) => i.productId);
  if (badQuantityIds.length > 0) return { ok: false, invalidProductIds: badQuantityIds };

  const supabase = createServiceClient();
  const ids = cartItems.map((i) => i.productId);
  const { data: products, error } = await supabase.from("products").select("id, name, price_cop, is_active").in("id", ids);
  if (error) throw error;

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const invalidProductIds = cartItems
    .filter((i) => !byId.get(i.productId)?.is_active)
    .map((i) => i.productId);

  if (invalidProductIds.length > 0) {
    return { ok: false, invalidProductIds };
  }

  const items = cartItems.map((i) => {
    const product = byId.get(i.productId)!;
    return { productId: i.productId, name: product.name, quantity: i.quantity, unitPriceCop: product.price_cop };
  });
  const totalCop = items.reduce((sum, i) => sum + i.unitPriceCop * i.quantity, 0);
  return { ok: true, items, totalCop };
}

export type WompiOrderResult =
  | { ok: true; orderId: string; reference: string; amountInCents: number; currency: string; signature: string; publicKey: string }
  | ValidationError;

export async function createWompiOrder(
  customer: { name: string; phone: string },
  cartItems: CartItemInput[]
): Promise<WompiOrderResult> {
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
    })
    .select("id")
    .single();
  if (orderError || !order) throw orderError ?? new Error("No se pudo crear el pedido.");

  const { error: itemsError } = await supabase.from("order_items").insert(
    priced.items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      quantity: i.quantity,
      unit_price_cop: i.unitPriceCop,
    }))
  );
  if (itemsError) throw itemsError;

  const amountInCents = priced.totalCop * 100;
  const currency = "COP";
  const signature = buildIntegritySignature({ reference: order.id, amountInCents, currency });

  return {
    ok: true,
    orderId: order.id,
    reference: order.id,
    amountInCents,
    currency,
    signature,
    publicKey: process.env.WOMPI_PUBLIC_KEY!,
  };
}

export type WhatsAppOrderResult = { ok: true; orderId: string; whatsappUrl: string } | ValidationError;

export async function createWhatsAppOrder(
  customer: { name: string; phone: string },
  cartItems: CartItemInput[]
): Promise<WhatsAppOrderResult> {
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
    })
    .select("id")
    .single();
  if (orderError || !order) throw orderError ?? new Error("No se pudo crear el pedido.");

  const { error: itemsError } = await supabase.from("order_items").insert(
    priced.items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      quantity: i.quantity,
      unit_price_cop: i.unitPriceCop,
    }))
  );
  if (itemsError) throw itemsError;

  const whatsappNumber = await getWhatsAppNumber();
  const message = buildWhatsAppMessage({
    customerName: customer.name,
    items: priced.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPriceCop: i.unitPriceCop })),
    totalCop: priced.totalCop,
  });

  return { ok: true, orderId: order.id, whatsappUrl: buildWhatsAppUrl(whatsappNumber, message) };
}
