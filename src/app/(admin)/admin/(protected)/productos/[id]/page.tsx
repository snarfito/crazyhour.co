import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProduct } from "../actions";
import { SELECT_CLASSES } from "@/lib/admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "../image-upload";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product }, { data: categories }, { data: images }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("product_images").select("*").eq("product_id", id),
  ]);

  if (!product) notFound();

  const updateWithId = updateProduct.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Editar producto</h1>
      <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>

      <Card className="mt-6">
        <CardContent>
          <form action={updateWithId} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="category_id">Categoría</Label>
              <select
                id="category_id"
                name="category_id"
                defaultValue={product.category_id}
                required
                className={SELECT_CLASSES}
              >
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
              <Label htmlFor="price_cop">Precio (COP)</Label>
              <Input
                id="price_cop"
                name="price_cop"
                type="number"
                min={0}
                defaultValue={product.price_cop}
                required
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={product.sku ?? ""} />
            </div>
            <Button type="submit" className="self-start">
              Guardar
            </Button>
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
    </div>
  );
}
