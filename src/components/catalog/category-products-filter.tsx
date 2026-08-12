"use client";

import { useState } from "react";
import { ProductGrid, type ProductListItem } from "./product-grid";

const OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "nuevo", label: "Nuevo" },
] as const;

export function CategoryProductsFilter({ products }: { products: ProductListItem[] }) {
  const [filter, setFilter] = useState<(typeof OPTIONS)[number]["value"]>("todos");
  const filtered = filter === "nuevo" ? products.filter((p) => p.isNew) : products;

  return (
    <div>
      <div role="radiogroup" aria-label="Filtrar productos" className="mb-4 inline-flex rounded-full border border-border p-1">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No hay productos nuevos por ahora.</p>
      ) : (
        <ProductGrid products={filtered} />
      )}
    </div>
  );
}
