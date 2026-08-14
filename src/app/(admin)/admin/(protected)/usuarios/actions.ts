"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePermission, type AdminPermissions } from "@/lib/supabase/dal";

export type InviteAdminState = { error: string } | { success: true } | undefined;

function isEmailAlreadyRegistered(message: string, code?: string): boolean {
  return code === "email_exists" || /already registered|already exists/i.test(message);
}

function readPermissions(formData: FormData): AdminPermissions {
  return {
    pedidos: formData.get("can_pedidos") === "on",
    productos: formData.get("can_productos") === "on",
    categorias: formData.get("can_categorias") === "on",
    ajustes: formData.get("can_ajustes") === "on",
    animaciones: formData.get("can_animaciones") === "on",
    usuarios: formData.get("can_usuarios") === "on",
  };
}

function permissionsToColumns(permissions: AdminPermissions) {
  return {
    can_pedidos: permissions.pedidos,
    can_productos: permissions.productos,
    can_categorias: permissions.categorias,
    can_ajustes: permissions.ajustes,
    can_animaciones: permissions.animaciones,
    can_usuarios: permissions.usuarios,
  };
}

export async function inviteAdmin(
  _prevState: InviteAdminState,
  formData: FormData,
): Promise<InviteAdminState> {
  const session = await requirePermission("usuarios");
  const email = String(formData.get("email") ?? "").trim();
  const permissions = readPermissions(formData);

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
    .insert({ id: userId, email, invited_by: session.userId, ...permissionsToColumns(permissions) });

  if (insertError) {
    if (createdNewAuthUser) {
      await supabase.auth.admin.deleteUser(userId);
    }
    return { error: "No se pudo dar acceso. Intenta de nuevo." };
  }

  revalidatePath("/admin/usuarios");
  return { success: true };
}

async function assertNotLastWithPermission(excludeUserId: string, permission: "usuarios") {
  const supabase = createServiceClient();
  const column = `can_${permission}` as const;
  const { count } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true })
    .eq(column, true)
    .neq("id", excludeUserId);
  if ((count ?? 0) === 0) {
    throw new Error("Debe quedar al menos un administrador con acceso a Usuarios.");
  }
}

export async function revokeAdmin(id: string) {
  const session = await requirePermission("usuarios");
  if (session.userId === id) {
    throw new Error("No puedes modificar tu propio acceso.");
  }

  const supabase = createServiceClient();
  const { data: target } = await supabase.from("admin_users").select("can_usuarios").eq("id", id).single();
  if (target?.can_usuarios) {
    await assertNotLastWithPermission(id, "usuarios");
  }

  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/usuarios");
}

export async function updatePermissions(id: string, permissions: AdminPermissions) {
  const session = await requirePermission("usuarios");
  if (session.userId === id) {
    throw new Error("No puedes modificar tu propio acceso.");
  }

  const supabase = createServiceClient();
  if (!permissions.usuarios) {
    const { data: target } = await supabase.from("admin_users").select("can_usuarios").eq("id", id).single();
    if (target?.can_usuarios) {
      await assertNotLastWithPermission(id, "usuarios");
    }
  }

  const { error } = await supabase.from("admin_users").update(permissionsToColumns(permissions)).eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/usuarios");
}
