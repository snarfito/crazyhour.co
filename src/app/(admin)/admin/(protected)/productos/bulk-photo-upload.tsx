"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { matchOptionByFilename } from "@/lib/match-option-by-filename";
import { uploadProductImage } from "./upload-product-image";
import { linkOptionImage } from "./attributes-actions";

export type MatchableOption = { id: string; displayName: string };

/** Sube varias fotos a la vez y, si el nombre del archivo coincide con el nombre de una opción (ej. "chrome-gold.jpg" → "Chrome Gold"), la asigna sola. */
export function BulkPhotoUpload({
  productId,
  options,
}: {
  productId: string;
  options: MatchableOption[];
}) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ matched: string[]; unmatched: string[] } | null>(null);
  const router = useRouter();

  async function handleFiles(files: FileList) {
    setUploading(true);
    setResult(null);
    const matched: string[] = [];
    const unmatched: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const { id: imageId } = await uploadProductImage(productId, file);
        const match = matchOptionByFilename(file.name, options);
        if (match) {
          await linkOptionImage(match.id, productId, imageId);
          matched.push(`${file.name} → ${match.displayName}`);
        } else {
          unmatched.push(file.name);
        }
      } catch {
        unmatched.push(`${file.name} (error al subir)`);
      }
    }

    setUploading(false);
    setResult({ matched, unmatched });
    router.refresh();
  }

  if (options.length === 0) return null;

  return (
    <div className="rounded-lg border border-dashed border-border p-3">
      <p className="text-sm font-medium text-foreground">Subir varias fotos y emparejar por nombre</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Si el archivo se llama igual (o parecido) a una opción, ej. &quot;chrome-gold.jpg&quot; para &quot;Chrome Gold&quot;, se
        asigna sola. Las que no coincidan quedan sin foto para asignarlas a mano.
      </p>
      <label className="mt-2 inline-block cursor-pointer text-sm text-primary hover:underline">
        {uploading ? "Subiendo..." : "Elegir fotos"}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {result && (
        <div className="mt-2 flex flex-col gap-1 text-xs">
          {result.matched.length > 0 && (
            <p className="text-brand-green">
              Emparejadas: {result.matched.join(", ")}
            </p>
          )}
          {result.unmatched.length > 0 && (
            <p className="text-muted-foreground">Sin pareja (asígnalas manualmente): {result.unmatched.join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
