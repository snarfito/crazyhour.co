"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { updateProductField, type EditableField } from "./actions";

export function EditableCell({
  productId,
  field,
  value,
  type = "text",
  required = false,
}: {
  productId: string;
  field: EditableField;
  value: string | number;
  type?: "text" | "number";
  required?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleBlur() {
    const previous = String(value);
    if (draft === previous) return;

    setError(null);
    startTransition(async () => {
      try {
        await updateProductField(productId, field, draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch (err) {
        setDraft(previous);
        setError(err instanceof Error ? err.message : "No se pudo guardar el cambio.");
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type={type}
        value={draft}
        required={required}
        aria-label={field}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
      />
      {saved && <Check aria-label="Guardado" className="size-4 shrink-0 text-brand-green" />}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
