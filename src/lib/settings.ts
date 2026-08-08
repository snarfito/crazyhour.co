import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export type Settings = {
  whatsappNumber: string;
  contactEmail: string | null;
  contactPhone: string | null;
};

export async function getSettings(): Promise<Settings> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("settings")
    .select("whatsapp_number, contact_email, contact_phone")
    .eq("id", true)
    .single();
  if (error || !data) throw error ?? new Error("No se encontró la configuración.");

  return {
    whatsappNumber: data.whatsapp_number,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
  };
}

export async function getWhatsAppNumber(): Promise<string> {
  const { whatsappNumber } = await getSettings();
  return whatsappNumber;
}
