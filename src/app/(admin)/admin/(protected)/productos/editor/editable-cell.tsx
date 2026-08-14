"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProductField, type EditableField } from "./actions";

export function EditableCell({
  productId,
  field,
  value,
  type = "text",
  required = false,
  min,
  multiline = false,
  onSaveError,
}: {
  productId: string;
  field: EditableField;
  value: string | number;
  type?: "text" | "number";
  required?: boolean;
  min?: number;
  multiline?: boolean;
  onSaveError?: (message: string) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [lastSaved, setLastSaved] = useState(String(value));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleBlur() {
    if (draft === lastSaved) return;

    setError(null);
    startTransition(async () => {
      try {
        await updateProductField(productId, field, draft);
        setLastSaved(draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo guardar el cambio.";
        setDraft(lastSaved);
        setError(message);
        onSaveError?.(message);
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {multiline ? (
        <Textarea
          value={draft}
          required={required}
          aria-label={field}
          rows={2}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
        />
      ) : (
        <Input
          type={type}
          value={draft}
          required={required}
          min={type === "number" ? min : undefined}
          aria-label={field}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
        />
      )}
      {saved && <Check aria-label="Guardado" className="size-4 shrink-0 text-brand-green" />}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
