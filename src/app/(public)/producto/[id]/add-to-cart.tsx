"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCart } from "@/components/cart/cart-context";
import { calculateTieredPrice, formatTierBreakdown } from "@/lib/pricing";
import { formatCOP } from "@/lib/format";

export function AddToCart({
  productId,
  name,
  unitPriceCop,
  pack1Qty,
  pack1PriceCop,
  pack2Qty,
  pack2PriceCop,
  imageUrl,
}: {
  productId: string;
  name: string;
  unitPriceCop: number;
  pack1Qty: number | null;
  pack1PriceCop: number | null;
  pack2Qty: number | null;
  pack2PriceCop: number | null;
  imageUrl: string | null;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { totalCop, pack1Count, pack2Count, looseUnits } = useMemo(
    () => calculateTieredPrice({ unitPriceCop, pack1Qty, pack1PriceCop, pack2Qty, pack2PriceCop }, quantity),
    [unitPriceCop, pack1Qty, pack1PriceCop, pack2Qty, pack2PriceCop, quantity]
  );

  const hasTiers = pack1Qty != null || pack2Qty != null;
  const breakdownText = formatTierBreakdown(pack1Count, pack2Count, looseUnits);

  function handleAdd() {
    addItem({ productId, name, unitPriceCop, pack1Qty, pack1PriceCop, pack2Qty, pack2PriceCop, imageUrl }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        <QuantityStepper quantity={quantity} onChange={setQuantity} />
        <Button type="button" onClick={handleAdd} className="flex-1">
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
