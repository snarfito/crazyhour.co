import { requirePermission, adminPermissionsFromRow, type AdminPermissions } from "@/lib/supabase/dal";
import { createServiceClient } from "@/lib/supabase/service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteForm } from "@/components/admin/delete-form";
import { InviteAdminForm } from "./invite-admin-form";
import { EditPermissionsRow } from "./edit-permissions-row";
import { PERMISSION_ITEMS } from "./permissions";
import { revokeAdmin } from "./actions";

function PermissionBadges({ permissions }: { permissions: AdminPermissions }) {
  const active = PERMISSION_ITEMS.filter((item) => permissions[item.key]);
  if (active.length === 0) {
    return <span className="text-xs text-muted-foreground">Sin acceso</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {active.map((item) => (
        <span key={item.key} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default async function UsuariosPage() {
  const session = await requirePermission("usuarios");
  const supabase = createServiceClient();
  const { data: admins } = await supabase
    .from("admin_users")
    .select("id, email, can_pedidos, can_productos, can_categorias, can_ajustes, can_animaciones, can_usuarios, created_at")
    .order("created_at");

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold">Usuarios</h1>
      <div className="mt-6">
        <InviteAdminForm />
      </div>
      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Correo</TableHead>
            <TableHead>Permisos</TableHead>
            <TableHead>Alta</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(admins ?? []).map((u) => {
            const permissions = adminPermissionsFromRow(u);
            return (
              <TableRow key={u.id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <PermissionBadges permissions={permissions} />
                </TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString("es-CO")}</TableCell>
                <TableCell>
                  {u.id !== session.userId && (
                    <div className="flex flex-col items-start gap-2">
                      <EditPermissionsRow id={u.id} permissions={permissions} />
                      <DeleteForm
                        action={revokeAdmin.bind(null, u.id)}
                        confirmMessage={`¿Revocar el acceso de "${u.email}"? Esta acción no se puede deshacer.`}
                      >
                        Revocar
                      </DeleteForm>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
