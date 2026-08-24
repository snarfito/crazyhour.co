import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminPermissions = {
  pedidos: boolean;
  productos: boolean;
  categorias: boolean;
  ajustes: boolean;
  animaciones: boolean;
  usuarios: boolean;
};

type AdminPermissionsRow = {
  can_pedidos: boolean;
  can_productos: boolean;
  can_categorias: boolean;
  can_ajustes: boolean;
  can_animaciones: boolean;
  can_usuarios: boolean;
};

export function adminPermissionsFromRow(row: AdminPermissionsRow): AdminPermissions {
  return {
    pedidos: row.can_pedidos,
    productos: row.can_productos,
    categorias: row.can_categorias,
    ajustes: row.can_ajustes,
    animaciones: row.can_animaciones,
    usuarios: row.can_usuarios,
  };
}

export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const admin = createServiceClient();
  const { data: adminUser } = await admin
    .from("admin_users")
    .select("can_pedidos, can_productos, can_categorias, can_ajustes, can_animaciones, can_usuarios")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminUser) {
    redirect("/admin/login");
  }

  return { userId: user.id, email: user.email ?? "", permissions: adminPermissionsFromRow(adminUser) };
});

const SECTION_PATHS: Array<[keyof AdminPermissions, string]> = [
  ["pedidos", "/admin/pedidos"],
  ["productos", "/admin/productos"],
  ["categorias", "/admin/categorias"],
  ["ajustes", "/admin/ajustes"],
  ["animaciones", "/admin/animaciones"],
  ["usuarios", "/admin/usuarios"],
];

// Falls back to the admin's first granted section instead of a hardcoded path,
// so this can't redirect a permission failure back into a loop on that same section.
export function firstAllowedPath(permissions: AdminPermissions): string {
  const match = SECTION_PATHS.find(([key]) => permissions[key]);
  return match ? match[1] : "/admin/login";
}

export async function requirePermission(permission: keyof AdminPermissions) {
  const session = await verifySession();
  if (!session.permissions[permission]) {
    redirect(firstAllowedPath(session.permissions));
  }
  return session;
}
