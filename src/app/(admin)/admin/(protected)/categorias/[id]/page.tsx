import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCategory } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CoverUpload } from "../cover-upload";

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("*").eq("id", id).single();

  if (!category) notFound();

  const updateWithId = updateCategory.bind(null, id);

  return (
    <div className="max-w-md">
      <h1 className="font-heading text-2xl font-extrabold">Editar categoría</h1>
      <form action={updateWithId} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" defaultValue={category.name} required />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={category.slug} required />
        </div>
        <div>
          <Label htmlFor="sort_order">Orden</Label>
          <Input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={category.sort_order}
            required
          />
        </div>
        <Button type="submit">Guardar</Button>
      </form>
      <div className="mt-8">
        <Label>Imagen de portada</Label>
        <CoverUpload categoryId={category.id} currentUrl={category.cover_image_url} />
      </div>
    </div>
  );
}
