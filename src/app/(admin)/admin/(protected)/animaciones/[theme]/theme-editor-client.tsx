"use client";

import { useState } from "react";
import { EventAnimation } from "@/components/event-animation/event-animation";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/admin/submit-button";
import type { ThemeMotionSettings } from "@/lib/theme-settings";
import type { EventTheme } from "@/lib/event-themes";
import { updateThemeSettingsAction } from "./actions";
import { ShapeImagesUpload } from "./shape-images-upload";

const RANGE_CLASSES = "w-full";
const INERT_CLASSES = "opacity-40 pointer-events-none";

export function ThemeEditorClient({
  theme,
  initial,
}: {
  theme: Exclude<EventTheme, "none">;
  initial: ThemeMotionSettings;
}) {
  const [settings, setSettings] = useState(initial);
  const hasCustomCss = Boolean(settings.customCss);

  function setField<K extends keyof ThemeMotionSettings>(key: K, value: ThemeMotionSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  const actionWithTheme = updateThemeSettingsAction.bind(null, theme);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="flex max-w-md flex-1 flex-col gap-6">
      <form action={actionWithTheme} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="particle_count">Cantidad de partículas</Label>
          <input
            id="particle_count"
            name="particle_count"
            type="range"
            min={1}
            max={30}
            value={settings.particleCount}
            onChange={(e) => setField("particleCount", Number(e.target.value))}
            className={RANGE_CLASSES}
          />
          <span className="text-sm text-muted-foreground">{settings.particleCount}</span>
        </div>

        <div>
          <Label htmlFor="min_duration">Velocidad mínima (segundos por recorrido)</Label>
          <input
            id="min_duration"
            name="min_duration"
            type="range"
            min={4}
            max={40}
            value={settings.minDuration}
            onChange={(e) => setField("minDuration", Number(e.target.value))}
            className={hasCustomCss ? `${RANGE_CLASSES} ${INERT_CLASSES}` : RANGE_CLASSES}
          />
          <span className="text-sm text-muted-foreground">{settings.minDuration}s</span>
        </div>

        <div>
          <Label htmlFor="max_duration">Velocidad máxima (segundos por recorrido)</Label>
          <input
            id="max_duration"
            name="max_duration"
            type="range"
            min={4}
            max={40}
            value={settings.maxDuration}
            onChange={(e) => setField("maxDuration", Number(e.target.value))}
            className={hasCustomCss ? `${RANGE_CLASSES} ${INERT_CLASSES}` : RANGE_CLASSES}
          />
          <span className="text-sm text-muted-foreground">{settings.maxDuration}s</span>
        </div>

        <div>
          <Label htmlFor="min_size">Tamaño mínimo (px)</Label>
          <input
            id="min_size"
            name="min_size"
            type="range"
            min={8}
            max={64}
            value={settings.minSize}
            onChange={(e) => setField("minSize", Number(e.target.value))}
            className={RANGE_CLASSES}
          />
          <span className="text-sm text-muted-foreground">{settings.minSize}px</span>
        </div>

        <div>
          <Label htmlFor="max_size">Tamaño máximo (px)</Label>
          <input
            id="max_size"
            name="max_size"
            type="range"
            min={8}
            max={64}
            value={settings.maxSize}
            onChange={(e) => setField("maxSize", Number(e.target.value))}
            className={RANGE_CLASSES}
          />
          <span className="text-sm text-muted-foreground">{settings.maxSize}px</span>
        </div>

        <div>
          <Label htmlFor="max_opacity">Opacidad</Label>
          <input
            id="max_opacity"
            name="max_opacity"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.maxOpacity}
            onChange={(e) => setField("maxOpacity", Number(e.target.value))}
            className={RANGE_CLASSES}
          />
          <span className="text-sm text-muted-foreground">{settings.maxOpacity}</span>
        </div>

        <div>
          <Label htmlFor="custom_css">CSS avanzado (opcional)</Label>
          <Textarea
            id="custom_css"
            name="custom_css"
            rows={6}
            value={settings.customCss ?? ""}
            onChange={(e) => setField("customCss", e.target.value || null)}
            placeholder={`.event-particle[data-theme="${theme}"] { animation: mySpin 3s ease-in-out infinite; }\n@keyframes mySpin { ... }`}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Si escribes CSS aquí, controla el movimiento por completo — la velocidad de arriba deja de aplicarse para este tema.
          </p>
        </div>

        <SubmitButton>Guardar</SubmitButton>
      </form>

      <ShapeImagesUpload
        theme={theme}
        urls={settings.shapeImageUrls}
        onChange={(shapeImageUrls) => setField("shapeImageUrls", shapeImageUrls)}
      />
      </div>

      <div className="shrink-0 lg:w-80">
        <Label>Vista previa</Label>
        <div className="relative mt-2 h-80 w-full overflow-hidden rounded-lg border border-input bg-background">
          <EventAnimation theme={theme} contained settings={settings} />
        </div>
      </div>
    </div>
  );
}
