import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
        <h1 className="font-heading text-2xl font-extrabold">Productos</h1>
        <Button render={<Link href="/admin/productos/nuevo">Nuevo producto</Link>} />
      </div>
      <div className="mt-4">
        <CategoryFilter categories={categories ?? []} selectedCategoryId={categoria} />
      </div>
      <Table className="mt-6">
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
              <TableCell>{p.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {(p.categories as { name: string } | null)?.name ?? "—"}
              </TableCell>
              <TableCell>${p.price_cop.toLocaleString("es-CO")}</TableCell>
              <TableCell>
                <form action={toggleProductActive.bind(null, p.id, !p.is_active)}>
                  <button
                    type="submit"
                    className={p.is_active ? "text-brand-green" : "text-muted-foreground"}
                  >
                    {p.is_active ? "Activo" : "Inactivo"}
                  </button>
                </form>
              </TableCell>
              <TableCell className="flex gap-3">
                <Link href={`/admin/productos/${p.id}`} className="text-primary hover:underline">
                  Editar
                </Link>
                <form action={deleteProduct.bind(null, p.id)}>
                  <button type="submit" className="text-destructive hover:underline">
                    Eliminar
                  </button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
