"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Package, Tags, Settings, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_ITEMS = [
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
] as const;

const FULL_ADMIN_ITEMS = [
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
  { href: "/admin/animaciones", label: "Animaciones", icon: Sparkles },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
] as const;

export function AdminNav({ isFullAdmin }: { isFullAdmin: boolean }) {
  const pathname = usePathname();
  const items = isFullAdmin ? [...BASE_ITEMS, ...FULL_ADMIN_ITEMS] : BASE_ITEMS;

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
