"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Sparkles />
        Generar portada con IA
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
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
          <Sparkles />
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
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (uploading) return;
      const file = Array.from(e.clipboardData?.items ?? [])
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();
      if (file) uploadFile(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, uploading]);

  async function uploadFile(file: File) {
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="Portada actual" className="h-full w-full object-cover" />
        ) : (
          <span className="px-2 text-center text-xs text-muted-foreground">Sin portada</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) uploadFile(file);
          }}
          className={cn(
            "flex flex-col items-start gap-2 rounded-lg border-2 border-dashed border-transparent p-2",
            dragOver && "border-primary bg-primary/5",
          )}
        >
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor="cover-upload-input"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "cursor-pointer",
                uploading && "pointer-events-none opacity-50",
              )}
            >
              <Upload />
              {uploading ? "Subiendo..." : "Subir portada"}
            </label>
            <input
              id="cover-upload-input"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
                e.target.value = "";
              }}
              disabled={uploading}
            />
            <GenerateCoverButton
              categoryId={categoryId}
              categoryName={categoryName}
              onGenerated={() => router.refresh()}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            O arrastra una imagen aquí, o pégala con {"Cmd/Ctrl+V"}
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
