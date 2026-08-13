import { createCategory } from "../actions";
import { buildThemeOptions } from "@/lib/event-themes";
import { getAllThemeMotionSettings } from "@/lib/theme-settings";
import { SELECT_CLASSES } from "@/lib/admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeSelectPreview } from "@/components/event-animation/theme-select-preview";

export default async function NuevaCategoriaPage() {
  const settingsMap = await getAllThemeMotionSettings();

  return (
    <div className="max-w-md">
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Nueva categoría</h1>
      <Card className="mt-6">
        <CardContent>
          <form action={createCategory} className="flex flex-col gap-4">
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
            <div>
              <div className="flex items-center gap-2">
                <input
                  id="is_featured"
                  name="is_featured"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <Label htmlFor="is_featured">Destacar en el home</Label>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Solo una categoría puede estar destacada — activarla aquí quita la marca a cualquier otra.
              </p>
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
