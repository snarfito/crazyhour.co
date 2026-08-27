import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProduct } from "../actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "../image-upload";
import { AttributesManager } from "../attributes-manager";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product }, { data: categories }, { data: images }, { data: links }, { data: attributes }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("product_images").select("*").eq("product_id", id),
    supabase.from("product_categories").select("category_id").eq("product_id", id),
    supabase.from("product_attributes").select("*, attribute_options(*)").eq("product_id", id),
  ]);

  if (!product) notFound();

  const selectedCategoryIds = new Set((links ?? []).map((l) => l.category_id));
  const updateWithId = updateProduct.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Editar producto</h1>
      <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>

      <Card className="mt-6">
        <CardContent>
          <form action={updateWithId} className="flex flex-col gap-4">
            <div>
              <Label>Categorías</Label>
              <div className="mt-1 flex flex-col gap-1.5">
                {(categories ?? []).map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <input
                      id={`category_${c.id}`}
                      name="category_ids"
                      type="checkbox"
                      value={c.id}
                      defaultChecked={selectedCategoryIds.has(c.id)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <Label htmlFor={`category_${c.id}`}>{c.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={product.name} required />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" defaultValue={product.description ?? ""} />
            </div>
            <div>
              <Label htmlFor="unit_price_cop">Precio por unidad (COP)</Label>
              <Input
                id="unit_price_cop"
                name="unit_price_cop"
                type="number"
                min={0}
                defaultValue={product.unit_price_cop}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pack2_qty">Media paca — cantidad</Label>
                <Input id="pack2_qty" name="pack2_qty" type="number" min={1} defaultValue={product.pack2_qty ?? ""} />
              </div>
              <div>
                <Label htmlFor="pack2_price_cop">Media paca — precio c/u</Label>
                <Input
                  id="pack2_price_cop"
                  name="pack2_price_cop"
                  type="number"
                  min={0}
                  defaultValue={product.pack2_price_cop ?? ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pack1_qty">Paca completa — cantidad</Label>
                <Input id="pack1_qty" name="pack1_qty" type="number" min={1} defaultValue={product.pack1_qty ?? ""} />
              </div>
              <div>
                <Label htmlFor="pack1_price_cop">Paca completa — precio c/u</Label>
                <Input
                  id="pack1_price_cop"
                  name="pack1_price_cop"
                  type="number"
                  min={0}
                  defaultValue={product.pack1_price_cop ?? ""}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={product.sku ?? ""} />
            </div>
            <SubmitButton className="self-start">Guardar</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fotos del producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload productId={product.id} images={images ?? []} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Variantes (color, talla, etc.)</CardTitle>
        </CardHeader>
        <CardContent>
          <AttributesManager
            productId={product.id}
            attributes={attributes ?? []}
            images={(images ?? []).map((img) => ({ id: img.id, url: img.enhanced_url || img.original_url }))}
            productPack1Qty={product.pack1_qty}
            productPack2Qty={product.pack2_qty}
          />
        </CardContent>
      </Card>
    </div>
  );
}
