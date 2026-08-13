"use client";

import { useRouter } from "next/navigation";
import { SELECT_CLASSES } from "@/lib/admin-ui";

export function CategoryFilter({
  categories,
  selectedCategoryId,
}: {
  categories: { id: string; name: string }[];
  selectedCategoryId?: string;
}) {
  const router = useRouter();

  return (
    <select
      aria-label="Filtrar por categoría"
      defaultValue={selectedCategoryId ?? ""}
      onChange={(e) => {
        const value = e.target.value;
        router.push(value ? `/admin/productos?categoria=${value}` : "/admin/productos");
      }}
      className={`${SELECT_CLASSES} max-w-xs`}
    >
      <option value="">Todas las categorías</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
