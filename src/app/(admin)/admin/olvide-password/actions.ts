"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type RequestResetState = { success: true } | undefined;

export async function requestPasswordReset(
  _prevState: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const email = String(formData.get("email") ?? "").trim();

  if (email) {
    const h = await headers();
    const origin = h.get("origin") ?? `https://${h.get("host")}`;
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/admin/restablecer-password`,
    });
  }

  // Always report success, whether or not the email has admin access —
  // don't let this form be used to check which emails are registered.
  return { success: true };
}
