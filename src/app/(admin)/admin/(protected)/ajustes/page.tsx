import { requireFullAdmin } from "@/lib/supabase/dal";
import { getSettings } from "@/lib/settings";
import { buildThemeOptions } from "@/lib/event-themes";
import { getAllThemeMotionSettings } from "@/lib/theme-settings";
import { updateSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeSelectPreview } from "@/components/event-animation/theme-select-preview";

const SELECT_CLASSES =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export default async function AjustesPage() {
  await requireFullAdmin();
  const [settings, settingsMap] = await Promise.all([getSettings(), getAllThemeMotionSettings()]);

  return (
    <div className="max-w-md">
      <h1 className="font-heading text-2xl font-extrabold">Ajustes</h1>
      <form action={updateSettings} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="whatsapp_number">Número de WhatsApp</Label>
          <Input
            key={settings.whatsappNumber}
            id="whatsapp_number"
            name="whatsapp_number"
            defaultValue={settings.whatsappNumber}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">Formato internacional sin &quot;+&quot;, ej: 573001234567</p>
        </div>
        <div>
          <Label htmlFor="contact_email">Correo de contacto</Label>
          <Input
            key={settings.contactEmail}
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={settings.contactEmail ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="contact_phone">Teléfono de contacto</Label>
          <Input
            key={settings.contactPhone}
            id="contact_phone"
            name="contact_phone"
            defaultValue={settings.contactPhone ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="active_event_theme">Tema de animación</Label>
          <ThemeSelectPreview
            key={settings.activeEventTheme}
            id="active_event_theme"
            name="active_event_theme"
            initialTheme={settings.activeEventTheme}
            options={buildThemeOptions(false)}
            className={SELECT_CLASSES}
            settingsMap={settingsMap}
          />
        </div>
        <Button type="submit">Guardar</Button>
      </form>
    </div>
  );
}
