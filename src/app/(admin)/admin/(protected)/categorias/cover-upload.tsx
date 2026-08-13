"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildCoverPrompt } from "@/lib/gemini/prompt";
import { setCategoryCoverImage, generateCategoryCoverImage } from "./actions";

function GenerateCoverButton({
  categoryId,
  categoryName,
  onGenerated,
}: {
  categoryId: string;
  categoryName: string;
  onGenerated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(() => buildCoverPrompt(categoryName));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" className="text-sm text-primary hover:underline" onClick={() => setOpen(true)}>
        Generar portada con IA
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-border p-3">
      <label htmlFor="cover-prompt-input" className="sr-only">
        Prompt
      </label>
      <Textarea id="cover-prompt-input" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                await generateCategoryCoverImage(categoryId, prompt);
                setOpen(false);
                onGenerated();
              } catch {
                setError("No se pudo generar la portada. Intenta de nuevo.");
              }
            })
          }
        >
          {pending ? "Generando..." : "Generar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function CoverUpload({
  categoryId,
  categoryName,
  currentUrl,
}: {
  categoryId: string;
  categoryName: string;
  currentUrl: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `categories/${categoryId}/cover.${ext}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("catalog-images")
      .upload(path, file, { upsert: true });

    setUploading(false);

    if (uploadError) {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("catalog-images").getPublicUrl(path);

    try {
      await setCategoryCoverImage(categoryId, publicUrl);
    } catch {
      setError("No se pudo guardar la portada. Intenta de nuevo.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-2 flex items-center gap-4">
      {currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt="Portada actual"
          className="h-16 w-16 rounded object-cover"
        />
      )}
      <div>
        <label htmlFor="cover-upload-input" className="text-sm text-primary hover:underline cursor-pointer">
          {uploading ? "Subiendo..." : "Subir portada"}
        </label>
        <input
          id="cover-upload-input"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleUpload}
          disabled={uploading}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <GenerateCoverButton
          categoryId={categoryId}
          categoryName={categoryName}
          onGenerated={() => router.refresh()}
        />
      </div>
    </div>
  );
}
