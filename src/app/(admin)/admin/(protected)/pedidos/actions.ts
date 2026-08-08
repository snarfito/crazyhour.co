"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { verifySession } from "@/lib/supabase/dal";

export async function markOrderPaid(id: string) {
  await verifySession();
  const supabase = createServiceClient();

  // The .eq("status", "pending_whatsapp") guard is the whole point: it's
  // what keeps this admin action from ever touching a pending_wompi order
  // (those confirm only via the webhook, see route.ts's own guard).
  const { error } = await supabase.from("orders").update({ status: "paid" }).eq("id", id).eq("status", "pending_whatsapp");
  if (error) throw error;

  revalidatePath("/admin/pedidos");
}
