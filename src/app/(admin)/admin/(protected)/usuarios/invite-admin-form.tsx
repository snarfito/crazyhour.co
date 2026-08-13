"use client";

import { useActionState } from "react";
import { inviteAdmin } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SELECT_CLASSES =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export function InviteAdminForm() {
  const [state, action, pending] = useActionState(inviteAdmin, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-4">
      <div>
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="role">Rol</Label>
        <select id="role" name="role" defaultValue="limited" className={SELECT_CLASSES}>
          <option value="limited">Limitado (pedidos, productos, categorías)</option>
          <option value="full">Completo</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Invitando..." : "Invitar"}
      </Button>
      {state && "error" in state && <p className="w-full text-sm text-destructive">{state.error}</p>}
      {state && "success" in state && <p className="w-full text-sm text-primary">Invitación enviada.</p>}
    </form>
  );
}
