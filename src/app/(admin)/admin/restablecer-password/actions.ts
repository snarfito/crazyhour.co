"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type UpdatePasswordState = { error: string } | undefined;

export async function updatePassword(
  _prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error || !data.user) {
    return { error: "No se pudo actualizar la contraseña. Solicita un nuevo enlace." };
  }

  // Clears any forced-change flag left by an admin-issued temporary
  // password — a no-op if this user never had one.
  await createServiceClient().from("admin_users").update({ must_change_password: false }).eq("id", data.user.id);

  redirect("/admin/categorias");
}
