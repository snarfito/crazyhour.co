"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart/cart-context";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { EmptyState } from "@/components/catalog/empty-state";
import { formatCOP } from "@/lib/format";
import { calculateTieredPrice, formatTierBreakdown } from "@/lib/pricing";
import { Button } from "@/components/ui/button";

export function CarritoPageClient() {
  const { items, setQuantity, removeItem, subtotalCop } = useCart();

  if (items.length === 0) {
    return <EmptyState message="Tu carrito está vacío. Explora el catálogo y agrega tus piñatas favoritas." />;
  }

  return (
    <div className="p-4">
      <h1 className="font-heading text-2xl font-extrabold">Tu carrito</h1>
      <ul className="mt-4 flex flex-col gap-4">
        {items.map((item) => {
          const { totalCop, pack1Count, pack2Count, looseUnits } = calculateTieredPrice(item, item.quantity);
          const hasTiers = item.pack1Qty != null || item.pack2Qty != null;
          const breakdownText = formatTierBreakdown(pack1Count, pack2Count, looseUnits);

          return (
            <li key={item.productId} className="flex gap-3 border-b border-border pb-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{item.name}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-sm text-destructive hover:underline"
                  >
                    Quitar
                  </button>
                </div>
                {hasTiers && breakdownText && <p className="text-xs text-muted-foreground">{breakdownText}</p>}
                <div className="flex items-center justify-between">
                  <QuantityStepper quantity={item.quantity} onChange={(q) => setQuantity(item.productId, q)} />
                  <p className="font-heading font-bold">{formatCOP(totalCop)}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 flex justify-between font-heading text-lg font-bold">
        <span>Total</span>
        <span data-testid="cart-total">{formatCOP(subtotalCop)}</span>
      </p>
      <Button
        render={<Link href="/checkout">Continuar</Link>}
        className="mt-4 w-full font-heading text-base font-extrabold"
      />
    </div>
  );
}
