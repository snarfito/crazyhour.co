import Link from "next/link";
import { requirePermission } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { ProductEditorTable, type EditorProduct } from "./product-editor-table";

export default async function ProductEditorPage() {
  await requirePermission("productos");
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, description, unit_price_cop, pack1_qty, pack1_price_cop, pack2_qty, pack2_price_cop, product_categories(category_id)",
      )
      .order("name"),
    supabase.from("categories").select("id, name").order("sort_order"),
  ]);

  const editorProducts: EditorProduct[] = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    unit_price_cop: p.unit_price_cop,
    pack1_qty: p.pack1_qty,
    pack1_price_cop: p.pack1_price_cop,
    pack2_qty: p.pack2_qty,
    pack2_price_cop: p.pack2_price_cop,
    category_ids: (p.product_categories as { category_id: string }[]).map((link) => link.category_id),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Editor rápido de productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Busca y edita en vivo, sin recargar la página.</p>
        </div>
        <Link href="/admin/productos" className="text-sm text-primary underline-offset-4 hover:underline">
          Volver a la vista de tabla
        </Link>
      </div>
      <div className="mt-4">
        <ProductEditorTable products={editorProducts} categories={categories ?? []} />
      </div>
    </div>
  );
}
