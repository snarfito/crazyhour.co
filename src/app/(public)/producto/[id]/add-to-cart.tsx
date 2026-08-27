"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCart, type SelectedOption } from "@/components/cart/cart-context";
import { calculateTieredPrice, formatTierBreakdown } from "@/lib/pricing";
import { formatCOP } from "@/lib/format";
import { flyToCart } from "@/lib/fly-to-cart";

export function AddToCart({
  productId,
  name,
  unitPriceCop,
  pack1Qty,
  pack1PriceCop,
  pack2Qty,
  pack2PriceCop,
  imageUrl,
  selectedOptions = [],
  disabled = false,
}: {
  productId: string;
  name: string;
  unitPriceCop: number;
  pack1Qty: number | null;
  pack1PriceCop: number | null;
  pack2Qty: number | null;
  pack2PriceCop: number | null;
  imageUrl: string | null;
  /** Selección de variantes ya resuelta por el padre (precio efectivo ya viene en unitPriceCop). */
  selectedOptions?: SelectedOption[];
  /** true mientras falte elegir una opción de algún grupo de variantes. */
  disabled?: boolean;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { totalCop, appliedTier } = useMemo(
    () => calculateTieredPrice({ unitPriceCop, pack1Qty, pack1PriceCop, pack2Qty, pack2PriceCop }, quantity),
    [unitPriceCop, pack1Qty, pack1PriceCop, pack2Qty, pack2PriceCop, quantity]
  );

  const hasTiers = pack1Qty != null || pack2Qty != null;
  const breakdownText = formatTierBreakdown(appliedTier);

  function handleAdd(button: HTMLElement) {
    addItem(
      { productId, name, unitPriceCop, pack1Qty, pack1PriceCop, pack2Qty, pack2PriceCop, imageUrl, selectedOptions },
      quantity
    );
    flyToCart(button);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        <QuantityStepper quantity={quantity} onChange={setQuantity} />
        <Button type="button" disabled={disabled} onClick={(e) => handleAdd(e.currentTarget)} className="flex-1">
          {added ? "Agregado ✓" : "Agregar al carrito"}
        </Button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Total ({quantity} un.): <span className="font-heading font-bold text-foreground">{formatCOP(totalCop)}</span>
      </p>
      {hasTiers && breakdownText && <p className="text-xs text-muted-foreground">{breakdownText}</p>}
    </div>
  );
}
