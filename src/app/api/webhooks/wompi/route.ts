import { createServiceClient } from "@/lib/supabase/service";
import { verifyWebhookSignature, type WompiWebhookPayload } from "@/lib/wompi";

export async function POST(request: Request) {
  const payload = (await request.json()) as WompiWebhookPayload;

  if (!verifyWebhookSignature(payload)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const { status, reference, id } = payload.data.transaction;
  if (status === "APPROVED") {
    const supabase = createServiceClient();
    // The .eq("status", "pending_wompi") guard makes this idempotent against
    // Wompi's webhook retries: a second APPROVED event for an already-paid
    // order matches zero rows instead of overwriting wompi_transaction_id.
    const { error } = await supabase
      .from("orders")
      .update({ status: "paid", wompi_transaction_id: id })
      .eq("id", reference)
      .eq("status", "pending_wompi");
    if (error) {
      return new Response("DB error", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}
