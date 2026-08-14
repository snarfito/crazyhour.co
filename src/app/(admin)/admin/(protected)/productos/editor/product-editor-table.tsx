"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditableCell } from "./editable-cell";
import { CategoryPickerCell } from "./category-picker-cell";
import { createQuickProduct } from "./actions";

const HEAD_CLASS = "sticky top-0 z-10 bg-muted font-semibold text-foreground uppercase tracking-wide text-xs";

export type EditorProduct = {
  id: string;
  name: string;
  description: string | null;
  unit_price_cop: number;
  pack1_qty: number | null;
  pack1_price_cop: number | null;
  pack2_qty: number | null;
  pack2_price_cop: number | null;
  category_ids: string[];
};

export function ProductEditorTable({
  products: initialProducts,
  categories,
}: {
  products: EditorProduct[];
  categories: { id: string; name: string }[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const filtered = products.filter((p) => p.name.toLowerCase().includes(deferredSearch.toLowerCase()));
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isCreating, startCreateTransition] = useTransition();

  function handleCreate() {
    startCreateTransition(async () => {
      try {
        const created = await createQuickProduct();
        setProducts((prev) => [{ ...created, category_ids: [] }, ...prev]);
        setSearch("");
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : "No se pudo crear el producto.");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          type="search"
          placeholder="Buscar producto por nombre..."
          aria-label="Buscar producto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button type="button" onClick={handleCreate} disabled={isCreating}>
          <Plus />
          {isCreating ? "Agregando..." : "Agregar producto"}
        </Button>
      </div>
      {globalError && (
        <div
          data-testid="global-error-banner"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {globalError}{" "}
          <button type="button" onClick={() => setGlobalError(null)} className="ml-2 underline">
            Cerrar
          </button>
        </div>
      )}
      <div className="mt-4 max-h-[75vh] overflow-y-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={cn(HEAD_CLASS, "min-w-48")}>Nombre</TableHead>
            <TableHead className={HEAD_CLASS}>Descripción</TableHead>
            <TableHead className={HEAD_CLASS}>Categorías</TableHead>
            <TableHead className={cn(HEAD_CLASS, "min-w-32")}>Unidad ($)</TableHead>
            <TableHead className={HEAD_CLASS}>Media paca (cant.)</TableHead>
            <TableHead className={HEAD_CLASS}>Media paca ($)</TableHead>
            <TableHead className={HEAD_CLASS}>Paca completa (cant.)</TableHead>
            <TableHead className={HEAD_CLASS}>Paca completa ($)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="min-w-48">
                <EditableCell productId={p.id} field="name" value={p.name} required onSaveError={setGlobalError} />
              </TableCell>
              <TableCell>
                <EditableCell
                  productId={p.id}
                  field="description"
                  value={p.description ?? ""}
                  multiline
                  onSaveError={setGlobalError}
                />
              </TableCell>
              <TableCell>
                <CategoryPickerCell
                  productId={p.id}
                  categories={categories}
                  selectedCategoryIds={p.category_ids}
                  onSaveError={setGlobalError}
                />
              </TableCell>
              <TableCell className="min-w-32">
                <EditableCell
                  productId={p.id}
                  field="unit_price_cop"
                  value={p.unit_price_cop}
                  type="number"
                  required
                  onSaveError={setGlobalError}
                />
              </TableCell>
              <TableCell>
                <EditableCell
                  productId={p.id}
                  field="pack2_qty"
                  value={p.pack2_qty ?? ""}
                  type="number"
                  min={1}
                  onSaveError={setGlobalError}
                />
              </TableCell>
              <TableCell>
                <EditableCell
                  productId={p.id}
                  field="pack2_price_cop"
                  value={p.pack2_price_cop ?? ""}
                  type="number"
                  onSaveError={setGlobalError}
                />
              </TableCell>
              <TableCell>
                <EditableCell
                  productId={p.id}
                  field="pack1_qty"
                  value={p.pack1_qty ?? ""}
                  type="number"
                  min={1}
                  onSaveError={setGlobalError}
                />
              </TableCell>
              <TableCell>
                <EditableCell
                  productId={p.id}
                  field="pack1_price_cop"
                  value={p.pack1_price_cop ?? ""}
                  type="number"
                  onSaveError={setGlobalError}
                />
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Sin resultados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
