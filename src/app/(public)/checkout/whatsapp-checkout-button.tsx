"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import { createWhatsAppOrder } from "./actions";

export function WhatsAppCheckoutButton({
  customerName,
  customerPhone,
  customerEmail,
  customerAddress,
  customerNeighborhood,
  customerCity,
  customerExtra,
  disabled,
}: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerNeighborhood: string;
  customerCity: string;
  customerExtra?: string;
  disabled?: boolean;
}) {
  const { items, removeItem, clear } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const result = await createWhatsAppOrder(
        {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
          neighborhood: customerNeighborhood,
          city: customerCity,
          extra: customerExtra,
        },
        items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      );
      if (!result.ok) {
        setError(result.error);
        result.invalidProductIds.forEach((id) => removeItem(id));
        return;
      }
      clear();
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      setSent(true);
    } catch {
      setError("No se pudo crear el pedido. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return <p className="text-sm text-muted-foreground">¡Listo! Te esperamos en WhatsApp para coordinar el pago.</p>;
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled || pending || items.length === 0}
        className="w-full"
      >
        {pending ? "Creando pedido..." : "Pedir por WhatsApp"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
