"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
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
  const { items, removeItemsByProductId, clear } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

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
        items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          selectedOptionIds: i.selectedOptions.map((o) => o.optionId),
        }))
      );
      if (!result.ok) {
        setError(result.error);
        result.invalidProductIds.forEach((id) => removeItemsByProductId(id));
        return;
      }
      clear();
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      setOrderNumber(result.orderNumber);
      setSent(true);
    } catch {
      setError("No se pudo crear el pedido. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        ¡Listo! Tu número de pedido es #{orderNumber}. Te esperamos en WhatsApp para coordinar el pago.
      </p>
    );
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled || pending || items.length === 0}
        className="w-full border-brand-whatsapp text-brand-whatsapp hover:bg-brand-whatsapp/10 [box-shadow:0_0_16px_rgba(37,211,102,.35)]"
      >
        <MessageCircle aria-hidden="true" className="h-4 w-4" />
        {pending ? "Creando pedido..." : "Pedir por WhatsApp"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
