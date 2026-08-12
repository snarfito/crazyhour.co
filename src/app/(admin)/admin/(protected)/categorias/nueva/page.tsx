import { createCategory } from "../actions";
import { buildThemeOptions } from "@/lib/event-themes";
import { getAllThemeMotionSettings } from "@/lib/theme-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeSelectPreview } from "@/components/event-animation/theme-select-preview";

const SELECT_CLASSES =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export default async function NuevaCategoriaPage() {
  const settingsMap = await getAllThemeMotionSettings();

  return (
    <div className="max-w-md">
      <h1 className="font-heading text-2xl font-extrabold">Nueva categoría</h1>
      <form action={createCategory} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" name="description" rows={3} />
        </div>
        <div>
          <Label htmlFor="animation_theme">Tema de animación</Label>
          <ThemeSelectPreview
            id="animation_theme"
            name="animation_theme"
            initialTheme=""
            options={buildThemeOptions(true)}
            className={SELECT_CLASSES}
            settingsMap={settingsMap}
          />
        </div>
        <div className="flex items-center gap-2">
          <input id="is_featured" name="is_featured" type="checkbox" className="h-4 w-4 rounded border-input" />
          <Label htmlFor="is_featured">Destacar en el home</Label>
        </div>
        <Button type="submit">Crear</Button>
      </form>
    </div>
  );
}
