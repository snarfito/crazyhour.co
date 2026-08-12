import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCategory } from "../actions";
import { buildThemeOptions } from "@/lib/event-themes";
import { getAllThemeMotionSettings } from "@/lib/theme-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CoverUpload } from "../cover-upload";
import { ThemeSelectPreview } from "@/components/event-animation/theme-select-preview";

const SELECT_CLASSES =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export default async function EditarCategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("*").eq("id", id).single();

  if (!category) notFound();

  const settingsMap = await getAllThemeMotionSettings();
  const updateWithId = updateCategory.bind(null, id);

  return (
    <div className="max-w-md">
      <h1 className="font-heading text-2xl font-extrabold">Editar categoría</h1>
      <form action={updateWithId} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input key={category.name} id="name" name="name" defaultValue={category.name} required />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input key={category.slug} id="slug" name="slug" defaultValue={category.slug} required />
        </div>
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            key={category.description ?? ""}
            id="description"
            name="description"
            rows={3}
            defaultValue={category.description ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="animation_theme">Tema de animación</Label>
          <ThemeSelectPreview
            key={category.animation_theme ?? ""}
            id="animation_theme"
            name="animation_theme"
            initialTheme={category.animation_theme ?? ""}
            options={buildThemeOptions(true)}
            className={SELECT_CLASSES}
            settingsMap={settingsMap}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            key={String(category.is_featured)}
            id="is_featured"
            name="is_featured"
            type="checkbox"
            defaultChecked={category.is_featured}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="is_featured">Destacar en el home</Label>
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
