import Link from "next/link";
import { Pencil, Plus, SquareMousePointer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteForm } from "@/components/admin/delete-form";
import { deleteProduct, toggleProductActive } from "./actions";
import { CategoryFilter } from "./category-filter";

const NO_MATCH_ID = "00000000-0000-0000-0000-000000000000";

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const supabase = await createClient();

  let productsQuery = supabase
    .from("products")
    .select("*, product_categories(categories(id, name))")
    .order("created_at", { ascending: false });

  if (categoria) {
    // Fetched separately (rather than filtering the embedded join with
    // !inner) so the displayed category list for each row still shows
    // ALL of a product's categories, not just the one being filtered on.
    const { data: linked } = await supabase.from("product_categories").select("product_id").eq("category_id", categoria);
    const productIds = (linked ?? []).map((l) => l.product_id);
    productsQuery = productsQuery.in("id", productIds.length > 0 ? productIds : [NO_MATCH_ID]);
  }

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    productsQuery,
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Catálogo de la tienda</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={
              <Link href="/admin/productos/editor">
                <SquareMousePointer />
                Editor rápido
              </Link>
            }
          />
          <Button
            render={
              <Link href="/admin/productos/nuevo">
                <Plus />
                Nuevo producto
              </Link>
            }
          />
        </div>
      </div>
      <div className="mt-4">
        <CategoryFilter categories={categories ?? []} selectedCategoryId={categoria} />
      </div>
      <Card className="mt-4 overflow-x-auto py-0">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categorías</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(products ?? []).map((p) => {
            const categoryNames = (p.product_categories as { categories: { id: string; name: string } | null }[])
              .map((link) => link.categories?.name)
              .filter((name): name is string => Boolean(name));
            return (
              <TableRow key={p.id}>
                <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {categoryNames.length > 0 ? categoryNames.join(", ") : "—"}
                </TableCell>
                <TableCell>${p.unit_price_cop.toLocaleString("es-CO")}</TableCell>
                <TableCell>
                  <form action={toggleProductActive.bind(null, p.id, !p.is_active)}>
                    <button
                      type="submit"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        p.is_active
                          ? "bg-brand-green/10 text-brand-green"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn("size-1.5 rounded-full", p.is_active ? "bg-brand-green" : "bg-muted-foreground")}
                      />
                      {p.is_active ? "Activo" : "Inactivo"}
                    </button>
                  </form>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    render={
                      <Link href={`/admin/productos/${p.id}`}>
                        <Pencil />
                        Editar
                      </Link>
                    }
                  />
                  <DeleteForm
                    action={deleteProduct.bind(null, p.id)}
                    confirmMessage={`¿Eliminar el producto "${p.name}"? Esta acción no se puede deshacer.`}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        </Table>
      </Card>
    </div>
  );
}
