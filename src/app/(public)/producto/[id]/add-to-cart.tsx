"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCart } from "@/components/cart/cart-context";

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

  function handleAdd() {
    addItem({ productId, name, unitPriceCop, pack1Qty, pack1PriceCop, pack2Qty, pack2PriceCop, imageUrl }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="mt-6 flex items-center gap-4">
      <QuantityStepper quantity={quantity} onChange={setQuantity} />
      <Button type="button" onClick={handleAdd} className="flex-1">
        {added ? "Agregado ✓" : "Agregar al carrito"}
      </Button>
    </div>
  );
}
