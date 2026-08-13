import { createClient } from "@/lib/supabase/server";
import { createProduct } from "../actions";
import { SELECT_CLASSES } from "@/lib/admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function NuevoProductoPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("sort_order");

  return (
    <div className="max-w-md">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Nuevo producto</h1>
      <Card className="mt-6">
        <CardContent>
          <form action={createProduct} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="category_id">Categoría</Label>
              <select id="category_id" name="category_id" required className={SELECT_CLASSES}>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" />
            </div>
            <div>
              <Label htmlFor="price_cop">Precio (COP)</Label>
              <Input id="price_cop" name="price_cop" type="number" min={0} required />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" />
            </div>
            <Button type="submit" className="self-start">
              Crear
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
