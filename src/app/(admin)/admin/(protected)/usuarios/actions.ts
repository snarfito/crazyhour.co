"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireFullAdmin } from "@/lib/supabase/dal";

export type InviteAdminState = { error: string } | { success: true } | undefined;

function isEmailAlreadyRegistered(message: string, code?: string): boolean {
  return code === "email_exists" || /already registered|already exists/i.test(message);
}

export async function inviteAdmin(
  _prevState: InviteAdminState,
  formData: FormData,
): Promise<InviteAdminState> {
  const session = await requireFullAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  if (role !== "full" && role !== "limited") {
    return { error: "Rol inválido." };
  }

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return { error: "Este correo ya tiene acceso al panel." };
  }

  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);

  let userId: string;
  let createdNewAuthUser: boolean;
  if (inviteError) {
    if (!isEmailAlreadyRegistered(inviteError.message, inviteError.code)) {
      return { error: inviteError.message };
    }
    const { data: list, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) return { error: listError.message };
    const found = list.users.find((u) => u.email === email);
    if (!found) return { error: "No se pudo encontrar la cuenta existente." };
    userId = found.id;
    createdNewAuthUser = false;
  } else {
    userId = invited.user.id;
    createdNewAuthUser = true;
  }

  const { error: insertError } = await supabase
    .from("admin_users")
    .insert({ id: userId, email, role, invited_by: session.userId });

  if (insertError) {
    if (createdNewAuthUser) {
      await supabase.auth.admin.deleteUser(userId);
    }
    return { error: "No se pudo dar acceso. Intenta de nuevo." };
  }

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function revokeAdmin(id: string) {
  const session = await requireFullAdmin();
  if (session.userId === id) {
    throw new Error("No puedes revocarte tu propio acceso.");
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/usuarios");
}
