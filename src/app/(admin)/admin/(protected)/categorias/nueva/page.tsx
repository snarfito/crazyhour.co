import { createCategory } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NuevaCategoriaPage() {
  return (
    <div className="max-w-md">
      <h1 className="font-heading text-2xl font-extrabold">Nueva categoría</h1>
      <form action={createCategory} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="sort_order">Orden</Label>
          <Input id="sort_order" name="sort_order" type="number" defaultValue={0} required />
        </div>
        <Button type="submit">Crear</Button>
      </form>
    </div>
  );
}
