import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteCategory } from "./actions";

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold">Categorías</h1>
        <Button render={<Link href="/admin/categorias/nueva">Nueva categoría</Link>} />
      </div>
      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Orden</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(categories ?? []).map((cat) => (
            <TableRow key={cat.id}>
              <TableCell>{cat.name}</TableCell>
              <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
              <TableCell>{cat.sort_order}</TableCell>
              <TableCell className="flex gap-3">
                <Link href={`/admin/categorias/${cat.id}`} className="text-primary hover:underline">
                  Editar
                </Link>
                <form action={deleteCategory.bind(null, cat.id)}>
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
