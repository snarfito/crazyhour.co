import { createServiceClient } from "@/lib/supabase/service";
import { verifyWebhookSignature, type WompiWebhookPayload } from "@/lib/wompi";
import { sendOrderReceivedEmail } from "@/lib/order-emails";

export async function POST(request: Request) {
  let payload: WompiWebhookPayload;
  try {
    payload = (await request.json()) as WompiWebhookPayload;
  } catch {
    return new Response("Invalid payload", { status: 401 });
  }

  if (!verifyWebhookSignature(payload)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const { status, reference, id, amount_in_cents } = payload.data.transaction;
  if (status === "APPROVED") {
    const supabase = createServiceClient();

    const { data: order } = await supabase.from("orders").select("total_cop").eq("id", reference).single();
    if (!order || order.total_cop * 100 !== amount_in_cents) {
      return new Response("Amount mismatch", { status: 401 });
    }

    // The .eq("status", "pending_wompi") guard makes this idempotent against
    // Wompi's webhook retries: a second APPROVED event for an already-paid
    // order matches zero rows instead of overwriting wompi_transaction_id
    // (and, via the empty `updated` array below, without re-sending the
    // received email either).
    const { data: updated, error } = await supabase
      .from("orders")
      .update({ status: "paid", wompi_transaction_id: id })
      .eq("id", reference)
      .eq("status", "pending_wompi")
      .select(
        "order_number, customer_name, customer_email, total_cop, shipping_address, shipping_neighborhood, shipping_city, shipping_extra"
      );
    if (error) {
      return new Response("DB error", { status: 500 });
    }

    if (updated && updated.length > 0) {
      const order = updated[0];
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("quantity, unit_price_cop, products(name)")
        .eq("order_id", reference);

      try {
        await sendOrderReceivedEmail({
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          orderNumber: order.order_number,
          items: (orderItems ?? []).map((item) => {
            // Without generated DB types, supabase-js can't tell this
            // embedded relation is many-to-one — it types `products` as an
            // array (same workaround as pedidos/queries.ts).
            const product = (Array.isArray(item.products) ? item.products[0] : item.products) as { name: string } | null;
            return { name: product?.name ?? "Producto eliminado", quantity: item.quantity, unitPriceCop: item.unit_price_cop };
          }),
          totalCop: order.total_cop,
          address: order.shipping_address,
          neighborhood: order.shipping_neighborhood,
          city: order.shipping_city,
          extra: order.shipping_extra ?? undefined,
        });
      } catch (emailError) {
        console.error("[resend]", emailError);
      }
    }
  }

  return new Response("OK", { status: 200 });
}
