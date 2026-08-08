import { verifySession } from "@/lib/supabase/dal";
import { signOut } from "../login/actions";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await verifySession();

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-heading font-extrabold">Crazy Hour — Admin</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{session.email}</span>
          <form action={signOut}>
            <button type="submit" className="text-primary hover:underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <nav className="flex gap-4 border-b border-border px-4 py-2 text-sm font-medium">
        <a href="/admin/pedidos" className="hover:text-primary">
          Pedidos
        </a>
        <a href="/admin/productos" className="hover:text-primary">
          Productos
        </a>
        <a href="/admin/categorias" className="hover:text-primary">
          Categorías
        </a>
        <a href="/admin/ajustes" className="hover:text-primary">
          Ajustes
        </a>
      </nav>
      <main className="font-body p-6">{children}</main>
    </>
  );
}
