import { verifySession } from "@/lib/supabase/dal";
import { signOut } from "../login/actions";
import { AdminNav } from "./admin-nav";
import { Button } from "@/components/ui/button";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await verifySession();
  const isFullAdmin = session.role === "full";

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary font-heading text-sm font-extrabold text-primary-foreground">
            C
          </span>
          <span className="font-heading font-extrabold text-foreground">Crazy Hour — Admin</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="hidden flex-col items-end leading-tight sm:flex">
            <span className="text-foreground">{session.email}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {isFullAdmin ? "Administrador" : "Acceso limitado"}
            </span>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>
      <div className="border-b border-border bg-background">
        <AdminNav isFullAdmin={isFullAdmin} />
      </div>
      <main className="font-body p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </>
  );
}
