"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Package, Tags, Settings, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminPermissions } from "@/lib/supabase/dal";

const NAV_ITEMS = [
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, permission: "pedidos" },
  { href: "/admin/productos", label: "Productos", icon: Package, permission: "productos" },
  { href: "/admin/categorias", label: "Categorías", icon: Tags, permission: "categorias" },
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings, permission: "ajustes" },
  { href: "/admin/animaciones", label: "Animaciones", icon: Sparkles, permission: "animaciones" },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users, permission: "usuarios" },
] as const;

export function AdminNav({ permissions }: { permissions: AdminPermissions }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => permissions[item.permission]);

  return (
    <nav className="flex gap-1 overflow-x-auto px-4 sm:px-6">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
