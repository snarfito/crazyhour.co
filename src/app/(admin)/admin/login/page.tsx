"use client";

import { useActionState } from "react";
import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <div className="mx-auto mt-24 max-w-sm">
      <h1 className="font-heading text-2xl font-extrabold">Crazy Hour — Admin</h1>
      <form action={action} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
