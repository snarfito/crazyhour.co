"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OlvidePasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary font-heading text-lg font-extrabold text-primary-foreground">
          C
        </span>
        <h1 className="font-heading text-xl font-extrabold text-foreground">Recuperar contraseña</h1>
      </div>
      <Card>
        <CardContent>
          {state?.success ? (
            <p className="text-sm text-foreground">
              Si el correo tiene acceso al panel, te enviamos un enlace para restablecer tu contraseña.
            </p>
          ) : (
            <form action={action} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="email">Correo</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/admin/login" className="text-primary underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
