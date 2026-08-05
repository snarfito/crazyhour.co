"use client";

import { useRouter } from "next/navigation";

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
      className="w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-2 text-sm"
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
