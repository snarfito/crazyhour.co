"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resetToTemporaryPassword } from "./actions";

export function ResetTempPasswordButton({ id }: { id: string }) {
  const [expanded, setExpanded] = useState(false);
  const [forceChange, setForceChange] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  if (tempPassword) {
    return (
      <div className="flex max-w-56 flex-col gap-1 text-sm">
        <p className="text-xs text-muted-foreground">Cópiala ahora, no se volverá a mostrar:</p>
        <code className="select-all rounded bg-muted px-2 py-1 font-mono text-sm">{tempPassword}</code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setTempPassword(null);
            setExpanded(false);
          }}
        >
          Cerrar
        </Button>
      </div>
    );
  }

  if (!expanded) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(true)}>
        Restablecer contraseña
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-1.5 text-sm">
        <input
          type="checkbox"
          checked={forceChange}
          onChange={(e) => setForceChange(e.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        Forzar cambio de contraseña en el próximo inicio de sesión
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await resetToTemporaryPassword(id, forceChange);
              if ("error" in result) {
                setError(result.error);
              } else {
                setTempPassword(result.tempPassword);
              }
            })
          }
        >
          {pending ? "Generando..." : "Generar contraseña temporal"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
