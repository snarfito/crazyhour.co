"use client";

import { useActionState } from "react";
import { inviteAdmin } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PERMISSION_ITEMS } from "./permissions";

const DEFAULT_CHECKED = new Set(["pedidos", "productos", "categorias"]);

export function InviteAdminForm() {
  const [state, action, pending] = useActionState(inviteAdmin, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-4">
      <div>
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label>Permisos</Label>
        <div className="mt-1 flex flex-wrap gap-3">
          {PERMISSION_ITEMS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1.5">
              <input
                id={`invite_can_${key}`}
                name={`can_${key}`}
                type="checkbox"
                defaultChecked={DEFAULT_CHECKED.has(key)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor={`invite_can_${key}`}>{label}</Label>
            </div>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Invitando..." : "Invitar"}
      </Button>
      {state && "error" in state && <p className="w-full text-sm text-destructive">{state.error}</p>}
      {state && "success" in state && <p className="w-full text-sm text-primary">Invitación enviada.</p>}
    </form>
  );
}
