import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Categorías</h1>
          <p className="mt-1 text-sm text-muted-foreground">Arrastra las filas para reordenar el home</p>
        </div>
        <Button
          render={
            <Link href="/admin/categorias/nueva">
              <Plus />
              Nueva categoría
            </Link>
          }
        />
      </div>
      <Card className="mt-4 overflow-x-auto py-0">
        <CategoriasListClient categories={categories ?? []} />
      </Card>
    </div>
  );
}
