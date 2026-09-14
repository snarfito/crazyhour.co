"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setTemporaryPassword } from "./actions";

export function ResetTempPasswordButton({ id }: { id: string }) {
  const [expanded, setExpanded] = useState(false);
  const [password, setPassword] = useState("");
  const [forceChange, setForceChange] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setExpanded(false);
    setPassword("");
    setError(null);
    setDone(false);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-1 text-sm">
        <p className="text-xs text-muted-foreground">Contraseña actualizada.</p>
        <Button type="button" variant="outline" size="sm" onClick={reset}>
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
    <div className="flex w-56 flex-col gap-2">
      <div>
        <Label htmlFor={`temp_pw_${id}`}>Nueva contraseña</Label>
        <Input
          id={`temp_pw_${id}`}
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          className="font-mono"
          autoComplete="off"
        />
      </div>
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
          disabled={pending || password.length < 8}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await setTemporaryPassword(id, password, forceChange);
              if ("error" in result) {
                setError(result.error);
              } else {
                setDone(true);
              }
            })
          }
        >
          {pending ? "Guardando..." : "Guardar contraseña"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={reset} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
