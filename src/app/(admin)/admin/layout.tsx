import { ADMIN_THEME_CLASS } from "@/lib/theme";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-testid="admin-theme-root" className={`${ADMIN_THEME_CLASS} min-h-screen bg-background text-foreground`}>
      <header className="border-b border-border px-4 py-3 font-heading font-extrabold">
        Crazy Hour — Admin
      </header>
      <main className="font-body p-6">{children}</main>
    </div>
  );
}
