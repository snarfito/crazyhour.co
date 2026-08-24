import { requirePermission } from "@/lib/supabase/dal";

export default async function ProductosLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requirePermission("productos");
  return children;
}
