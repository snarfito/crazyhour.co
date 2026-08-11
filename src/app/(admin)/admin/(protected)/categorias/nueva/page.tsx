import { createCategory } from "../actions";
import { buildThemeOptions } from "@/lib/event-themes";
import { getAllThemeMotionSettings } from "@/lib/theme-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          <Label htmlFor="sort_order">Orden</Label>
          <Input id="sort_order" name="sort_order" type="number" defaultValue={0} required />
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
        <Button type="submit">Crear</Button>
      </form>
    </div>
  );
}
