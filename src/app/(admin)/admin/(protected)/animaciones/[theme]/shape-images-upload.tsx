"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EventTheme } from "@/lib/event-themes";
import { addThemeShapeImageAction, removeThemeShapeImageAction } from "./actions";

export function ShapeImagesUpload({
  theme,
  urls,
  onChange,
}: {
  theme: Exclude<EventTheme, "none">;
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `event-shapes/${theme}/${Date.now()}.${ext}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("catalog-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      setError("No se pudo subir la imagen. Intenta de nuevo.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("catalog-images").getPublicUrl(path);

    try {
      await addThemeShapeImageAction(theme, publicUrl);
      onChange([...urls, publicUrl]);
    } catch {
      setError("No se pudo guardar la figura. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  async function removeUrl(url: string) {
    setError(null);
    try {
      await removeThemeShapeImageAction(theme, url);
      onChange(urls.filter((u) => u !== url));
    } catch {
      setError("No se pudo eliminar la figura. Intenta de nuevo.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Label>Figuras personalizadas (PNG)</Label>
      <p className="text-xs text-muted-foreground">
        Si subes al menos una, reemplazan los íconos por defecto de este tema en la animación.
      </p>
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => (
            <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element -- small admin-only thumbnail */}
              <img src={url} alt="Figura personalizada" className="h-full w-full object-contain" />
              <button
                type="button"
                aria-label="Quitar figura"
                onClick={() => removeUrl(url)}
                className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5 text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div>
        <label
          htmlFor={`shape-upload-input-${theme}`}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "cursor-pointer",
            uploading && "pointer-events-none opacity-50",
          )}
        >
          <Upload />
          {uploading ? "Subiendo..." : "Subir figura"}
        </label>
        <input
          id={`shape-upload-input-${theme}`}
          type="file"
          accept="image/png"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
            e.target.value = "";
          }}
          disabled={uploading}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
