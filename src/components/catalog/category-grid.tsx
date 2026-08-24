"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CategoryCard } from "./category-card";

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
  productCount: number;
};

export function CategoryGrid({ categories }: { categories: CategoryListItem[] }) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const filtered = term ? categories.filter((c) => c.name.toLowerCase().includes(term)) : categories;

  return (
    <div>
      {categories.length > 5 && (
        <div className="relative mb-4 sm:max-w-xs">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Buscar categoría…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar categoría"
            className="h-10 pl-9"
          />
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No hay categorías que coincidan con “{query}”.</p>
      ) : (
        <div className="grid grid-flow-dense auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:grid-cols-3 lg:auto-rows-[220px] lg:grid-cols-4">
          {filtered.map((c, i) => (
            <CategoryCard
              key={c.id}
              id={c.id}
              name={c.name}
              slug={c.slug}
              coverImageUrl={c.cover_image_url}
              wide={i % 5 === 4}
              index={i}
              productCount={c.productCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
