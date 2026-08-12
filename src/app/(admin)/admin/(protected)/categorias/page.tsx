import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CategoriasListClient } from "./categorias-list-client";

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, sort_order")
    .order("sort_order");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold">Categorías</h1>
        <Button render={<Link href="/admin/categorias/nueva">Nueva categoría</Link>} />
      </div>
      <div className="mt-6">
        <CategoriasListClient categories={categories ?? []} />
      </div>
    </div>
  );
}
