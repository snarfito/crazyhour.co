import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoriasListClient } from "./categorias-list-client";

export default async function CategoriasLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, sort_order")
    .order("sort_order");

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="shrink-0 lg:w-96">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Categorías</h1>
          <Button
            size="sm"
            render={
              <Link href="/admin/categorias/nueva">
                <Plus />
                Nueva
              </Link>
            }
          />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Arrastra las filas para reordenar el home</p>
        <Card className="mt-4 overflow-x-auto py-0">
          <CategoriasListClient categories={categories ?? []} />
        </Card>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
