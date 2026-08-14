"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { AdminPermissions } from "@/lib/supabase/dal";
import { PERMISSION_ITEMS } from "./permissions";
import { updatePermissions } from "./actions";

export function EditPermissionsRow({ id, permissions }: { id: string; permissions: AdminPermissions }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(permissions);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!expanded) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setDraft(permissions);
          setError(null);
          setExpanded(true);
        }}
      >
        Editar permisos
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {PERMISSION_ITEMS.map(({ key, label }) => (
          <label key={key} htmlFor={`edit_${id}_${key}`} className="flex items-center gap-1.5 text-sm">
            <input
              id={`edit_${id}_${key}`}
              type="checkbox"
              checked={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            {label}
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                await updatePermissions(id, draft);
                setExpanded(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo guardar.");
              }
            })
          }
        >
          {pending ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
