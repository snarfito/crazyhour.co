import { requireFullAdmin } from "@/lib/supabase/dal";
import { createServiceClient } from "@/lib/supabase/service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InviteAdminForm } from "./invite-admin-form";
import { revokeAdmin } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  full: "Completo",
  limited: "Limitado",
};

export default async function UsuariosPage() {
  const session = await requireFullAdmin();
  const supabase = createServiceClient();
  const { data: admins } = await supabase
    .from("admin_users")
    .select("id, email, role, created_at")
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
            <TableHead>Rol</TableHead>
            <TableHead>Alta</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(admins ?? []).map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.email}</TableCell>
              <TableCell>{ROLE_LABEL[u.role] ?? u.role}</TableCell>
              <TableCell>{new Date(u.created_at).toLocaleDateString("es-CO")}</TableCell>
              <TableCell>
                {u.id !== session.userId && (
                  <form action={revokeAdmin.bind(null, u.id)}>
                    <button type="submit" className="text-destructive hover:underline">
                      Revocar
                    </button>
                  </form>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
