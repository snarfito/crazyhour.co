"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// The invite/recovery link's token is either a URL hash (never sent to the
// server) or a one-time code — the Supabase browser client picks either one
// up from window.location as soon as it's created and turns it into a
// session, so we just wait for that before showing the form.
function useLinkSession() {
  const [status, setStatus] = useState<"loading" | "ok" | "invalid">("loading");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "ok" : "invalid");
    });
  }, []);

  return status;
}

export default function RestablecerPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  const sessionStatus = useLinkSession();

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary font-heading text-lg font-extrabold text-primary-foreground">
          C
        </span>
        <h1 className="font-heading text-xl font-extrabold text-foreground">Elige una nueva contraseña</h1>
      </div>
      <Card>
        <CardContent>
          {sessionStatus === "invalid" ? (
            <>
              <p className="text-sm text-destructive">
                Este enlace ya no es válido o expiró.
              </p>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                <Link href="/admin/olvide-password" className="text-primary underline">
                  Solicitar uno nuevo
                </Link>
              </p>
            </>
          ) : (
            <form action={action} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
              <Button type="submit" disabled={pending || sessionStatus === "loading"}>
                {pending ? "Guardando..." : "Guardar contraseña"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
