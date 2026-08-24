"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePermission } from "@/lib/supabase/dal";

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
      shipping_city: formData.get("shipping_city") as string,
    })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/pedidos");
}
