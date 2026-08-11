"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { verifySession } from "@/lib/supabase/dal";

export async function updateSettings(formData: FormData) {
  await verifySession();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("settings")
    .update({
      whatsapp_number: String(formData.get("whatsapp_number") ?? "").trim(),
      contact_email: String(formData.get("contact_email") ?? "").trim() || null,
      contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
      active_event_theme: String(formData.get("active_event_theme") ?? "none"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) throw error;

  revalidatePath("/admin/ajustes");
}
