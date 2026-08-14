import { createClient } from "@/lib/supabase/server";
import { createProduct } from "../actions";
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
              <Label>Categorías</Label>
              <div className="mt-1 flex flex-col gap-1.5">
                {(categories ?? []).map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <input
                      id={`category_${c.id}`}
                      name="category_ids"
                      type="checkbox"
                      value={c.id}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <Label htmlFor={`category_${c.id}`}>{c.name}</Label>
                  </div>
                ))}
              </div>
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
              <Label htmlFor="unit_price_cop">Precio por unidad (COP)</Label>
              <Input id="unit_price_cop" name="unit_price_cop" type="number" min={0} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pack2_qty">Media paca — cantidad</Label>
                <Input id="pack2_qty" name="pack2_qty" type="number" min={1} />
              </div>
              <div>
                <Label htmlFor="pack2_price_cop">Media paca — precio c/u</Label>
                <Input id="pack2_price_cop" name="pack2_price_cop" type="number" min={0} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pack1_qty">Paca completa — cantidad</Label>
                <Input id="pack1_qty" name="pack1_qty" type="number" min={1} />
              </div>
              <div>
                <Label htmlFor="pack1_price_cop">Paca completa — precio c/u</Label>
                <Input id="pack1_price_cop" name="pack1_price_cop" type="number" min={0} />
              </div>
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
