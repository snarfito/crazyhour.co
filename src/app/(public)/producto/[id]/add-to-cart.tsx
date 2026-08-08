"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCart } from "@/components/cart/cart-context";

export function AddToCart({
  productId,
  name,
  priceCop,
  imageUrl,
}: {
  productId: string;
  name: string;
  priceCop: number;
  imageUrl: string | null;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({ productId, name, priceCop, imageUrl }, quantity);
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
