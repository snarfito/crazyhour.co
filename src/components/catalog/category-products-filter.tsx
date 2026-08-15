"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductGrid, type ProductListItem } from "./product-grid";

const OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "nuevo", label: "Nuevo" },
] as const;

export function CategoryProductsFilter({ products }: { products: ProductListItem[] }) {
  const [filter, setFilter] = useState<(typeof OPTIONS)[number]["value"]>("todos");
  const [query, setQuery] = useState("");

  const byTab = filter === "nuevo" ? products.filter((p) => p.isNew) : products;
  const term = query.trim().toLowerCase();
  const filtered = term ? byTab.filter((p) => p.name.toLowerCase().includes(term)) : byTab;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Filtrar productos" className="inline-flex rounded-full border border-border p-1">
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
        <div className="relative w-full sm:w-56">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Buscar en esta categoría…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar en esta categoría"
            className="h-9 pl-9"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">
          {term ? `No hay productos que coincidan con “${query}”.` : "No hay productos nuevos por ahora."}
        </p>
      ) : (
        <ProductGrid products={filtered} />
      )}
    </div>
  );
}
