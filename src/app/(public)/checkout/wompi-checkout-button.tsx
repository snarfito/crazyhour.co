"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import { createWompiOrder } from "./actions";

declare global {
  interface Window {
    WidgetCheckout?: new (config: Record<string, unknown>) => { open: (callback: (result: unknown) => void) => void };
  }
}

const WOMPI_WIDGET_SRC = "https://checkout.wompi.co/widget.js";

function loadWompiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.WidgetCheckout) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${WOMPI_WIDGET_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Wompi.")));
      return;
    }
    const script = document.createElement("script");
    script.src = WOMPI_WIDGET_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Wompi."));
    document.body.appendChild(script);
  });
}

export function WompiCheckoutButton({
  customerName,
  customerPhone,
  disabled,
}: {
  customerName: string;
  customerPhone: string;
  disabled?: boolean;
}) {
  const { items, removeItem, clear } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const result = await createWompiOrder(
        { name: customerName, phone: customerPhone },
        items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      );
      if (!result.ok) {
        setError(result.error);
        result.invalidProductIds.forEach((id) => removeItem(id));
        return;
      }
      await loadWompiScript();
      const checkout = new window.WidgetCheckout!({
        currency: result.currency,
        amountInCents: result.amountInCents,
        reference: result.reference,
        publicKey: result.publicKey,
        signature: { integrity: result.signature },
        redirectUrl: `${window.location.origin}/checkout/gracias?ref=${result.reference}`,
      });
      clear();
      checkout.open(() => {});
    } catch {
      setError("No se pudo iniciar el pago con Wompi. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button type="button" onClick={handleClick} disabled={disabled || pending || items.length === 0} className="w-full">
        {pending ? "Cargando..." : "Pagar con Wompi"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
