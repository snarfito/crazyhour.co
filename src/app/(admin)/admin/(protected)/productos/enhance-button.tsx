"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_ENHANCE_PROMPT } from "@/lib/gemini/prompt";
import { enhanceProductImage } from "./enhance-action";

export function EnhanceButton({ imageId, onEnhanced }: { imageId: string; onEnhanced?: () => void }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_ENHANCE_PROMPT);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Sparkles />
        Mejorar imagen
      </Button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                await enhanceProductImage(imageId, prompt);
                setOpen(false);
                onEnhanced?.();
              } catch {
                setError("No se pudo procesar la imagen. Intenta de nuevo.");
              }
            })
          }
        >
          <Sparkles />
          {pending ? "Procesando..." : "Procesar con Gemini"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
