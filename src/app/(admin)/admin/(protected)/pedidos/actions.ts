"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePermission } from "@/lib/supabase/dal";
import { sendOrderShippedEmail } from "@/lib/order-emails";

export async function markOrderPaid(id: string) {
  await requirePermission("pedidos");
  const supabase = createServiceClient();

  // The .eq("status", "pending_whatsapp") guard is the whole point: it's
  // what keeps this admin action from ever touching a pending_wompi order
  // (those confirm only via the webhook, see route.ts's own guard).
  const { error } = await supabase.from("orders").update({ status: "paid" }).eq("id", id).eq("status", "pending_whatsapp");
  if (error) throw error;

  revalidatePath("/admin/pedidos");
}

export async function markOrderPreparing(id: string) {
  await requirePermission("pedidos");
  const supabase = createServiceClient();

  const { error } = await supabase.from("orders").update({ status: "alistando" }).eq("id", id).eq("status", "paid");
  if (error) throw error;

  revalidatePath("/admin/pedidos");
}

export async function markOrderShipped(id: string, formData: FormData) {
  await requirePermission("pedidos");
  const supabase = createServiceClient();

  const carrierChoice = formData.get("shipping_carrier") as string;
  const carrier = carrierChoice === "otro" ? (formData.get("shipping_carrier_other") as string) : carrierChoice;
  const trackingNumber = formData.get("tracking_number") as string;

  // .select(...) without .single() is deliberate: the .eq("status", "alistando")
  // guard means an order in the wrong status matches 0 rows, and .single()
  // would turn that into a thrown error instead of the silent no-op the
  // guard is designed to produce.
  const { data: updated, error } = await supabase
    .from("orders")
    .update({ status: "shipped", shipping_carrier: carrier, tracking_number: trackingNumber })
    .eq("id", id)
    .eq("status", "alistando")
    .select("order_number, customer_name, customer_email");
  if (error) throw error;

  if (updated && updated.length > 0) {
    try {
      await sendOrderShippedEmail({
        customerName: updated[0].customer_name,
        customerEmail: updated[0].customer_email,
        orderNumber: updated[0].order_number,
        carrier,
        trackingNumber,
      });
    } catch (emailError) {
      console.error("[resend]", emailError);
    }
  }

  revalidatePath("/admin/pedidos");
}

export async function deleteOrder(id: string) {
  await requirePermission("pedidos");
  const supabase = createServiceClient();

  // order_items cascades via the FK's ON DELETE CASCADE (migration 0007).
  // Only touches orders/order_items — never products or categories.
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/pedidos");
}

export async function updateCustomerDetails(id: string, formData: FormData) {
  await requirePermission("pedidos");
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("orders")
    .update({
      customer_name: formData.get("customer_name") as string,
      customer_phone: formData.get("customer_phone") as string,
      customer_email: formData.get("customer_email") as string,
      shipping_address: formData.get("shipping_address") as string,
      shipping_neighborhood: formData.get("shipping_neighborhood") as string,
      shipping_city: formData.get("shipping_city") as string,
      shipping_extra: (formData.get("shipping_extra") as string) || null,
    })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/pedidos");
}
