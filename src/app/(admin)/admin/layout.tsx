import { ADMIN_THEME_CLASS } from "@/lib/theme";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      data-testid="admin-theme-root"
      className={`${ADMIN_THEME_CLASS} min-h-screen bg-background text-foreground`}
    >
      {children}
    </div>
  );
}
