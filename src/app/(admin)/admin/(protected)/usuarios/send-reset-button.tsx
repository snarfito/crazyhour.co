"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendPasswordReset } from "./actions";

export function SendResetButton({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  if (sent) {
    return <p className="text-xs text-muted-foreground">Enlace enviado</p>;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await sendPasswordReset(email);
          setSent(true);
        })
      }
    >
      {pending ? "Enviando..." : "Restablecer contraseña"}
    </Button>
  );
}
