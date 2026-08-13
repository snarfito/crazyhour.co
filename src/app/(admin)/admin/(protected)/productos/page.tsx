import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteForm } from "@/components/admin/delete-form";
import { deleteProduct, toggleProductActive } from "./actions";
import { CategoryFilter } from "./category-filter";

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const supabase = await createClient();

  let productsQuery = supabase
    .from("products")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });
  if (categoria) {
    productsQuery = productsQuery.eq("category_id", categoria);
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
        <Button
          render={
            <Link href="/admin/productos/nuevo">
              <Plus />
              Nuevo producto
            </Link>
          }
        />
      </div>
      <div className="mt-4">
        <CategoryFilter categories={categories ?? []} selectedCategoryId={categoria} />
      </div>
      <Card className="mt-4 overflow-x-auto py-0">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(products ?? []).map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium text-foreground">{p.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {(p.categories as { name: string } | null)?.name ?? "—"}
              </TableCell>
              <TableCell>${p.price_cop.toLocaleString("es-CO")}</TableCell>
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
          ))}
        </TableBody>
        </Table>
      </Card>
    </div>
  );
}
