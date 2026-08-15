"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import { Input } from "@/components/ui/input";

type SearchResult = { id: string; name: string; unitPriceCop: number; imageUrl: string | null };

// Category pages (e.g. /halloween) are the only single-segment public
// routes besides these two — they get their own scoped search next to the
// Todos/Nuevo tabs instead (see CategoryProductsFilter), so the sitewide
// search hides there to avoid showing two search boxes on the same page.
const NON_CATEGORY_TOP_LEVEL_PATHS = ["/carrito", "/checkout"];

function isCategoryPage(pathname: string): boolean {
  if (pathname === "/" || pathname.startsWith("/producto")) return false;
  return !NON_CATEGORY_TOP_LEVEL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function SiteSearch() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const supabase = createClient();
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, unit_price_cop, product_images(original_url, enhanced_url)")
        .eq("is_active", true)
        .ilike("name", `%${term}%`)
        .limit(6);
      setResults(
        (data ?? []).map((p) => {
          const images = (p.product_images ?? []) as { original_url: string; enhanced_url: string | null }[];
          const first = images.find((img) => img.enhanced_url || img.original_url);
          return {
            id: p.id,
            name: p.name,
            unitPriceCop: p.unit_price_cop,
            imageUrl: first ? first.enhanced_url || first.original_url : null,
          };
        })
      );
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (isCategoryPage(pathname)) return null;

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="Buscar productos…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label="Buscar productos"
          className="h-10 pl-9"
        />
      </div>
      {showDropdown && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover shadow-md">
          {results.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">Sin resultados para “{query}”.</p>
          ) : (
            results.map((r) => (
              <Link
                key={r.id}
                href={`/producto/${r.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 border-b border-border/60 p-2 last:border-0 hover:bg-muted"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                  {r.imageUrl && <Image src={r.imageUrl} alt="" fill sizes="40px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCOP(r.unitPriceCop)}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
