import type { AdminPermissions } from "@/lib/supabase/dal";

export const PERMISSION_ITEMS: { key: keyof AdminPermissions; label: string }[] = [
  { key: "pedidos", label: "Pedidos" },
  { key: "productos", label: "Productos" },
  { key: "categorias", label: "Categorías" },
  { key: "ajustes", label: "Ajustes" },
  { key: "animaciones", label: "Animaciones" },
  { key: "usuarios", label: "Usuarios" },
];
