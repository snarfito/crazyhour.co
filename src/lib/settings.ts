import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { isValidEventTheme, type EventTheme } from "@/lib/event-themes";

export type Settings = {
  whatsappNumber: string;
  contactEmail: string | null;
  contactPhone: string | null;
  activeEventTheme: EventTheme;
};

export async function getSettings(): Promise<Settings> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("settings")
    .select("whatsapp_number, contact_email, contact_phone, active_event_theme")
    .eq("id", true)
    .single();
  if (error || !data) throw error ?? new Error("No se encontró la configuración.");

  return {
    whatsappNumber: data.whatsapp_number,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    activeEventTheme: isValidEventTheme(data.active_event_theme) ? data.active_event_theme : "none",
  };
}

export async function getWhatsAppNumber(): Promise<string> {
  const { whatsappNumber } = await getSettings();
  return whatsappNumber;
}

export async function getActiveEventTheme(): Promise<EventTheme> {
  const { activeEventTheme } = await getSettings();
  return activeEventTheme;
}
