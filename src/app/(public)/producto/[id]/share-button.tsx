"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        // El usuario canceló el sheet nativo — no es un error a mostrar.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={copied ? "Enlace copiado" : "Compartir"}
      onClick={handleShare}
    >
      {copied ? <Check /> : <Share2 />}
    </Button>
  );
}
