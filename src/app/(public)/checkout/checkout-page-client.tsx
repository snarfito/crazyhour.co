"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { formatCOP } from "@/lib/format";
import { calculateTieredPrice } from "@/lib/pricing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WompiCheckoutButton } from "./wompi-checkout-button";
import { WhatsAppCheckoutButton } from "./whatsapp-checkout-button";

export function CheckoutPageClient() {
  const { items, subtotalCop } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (items.length === 0) {
    return (
      <div className="mx-auto mt-24 max-w-md text-center">
        <p className="text-muted-foreground">Tu carrito está vacío.</p>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0;

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="font-heading text-2xl font-extrabold">Checkout</h1>
      <ul className="mt-4 divide-y divide-border">
        {items.map((item) => (
          <li key={item.productId} className="flex justify-between py-2 text-sm">
            <span>
              {item.quantity}x <span>{item.name}</span>
            </span>
            <span>{formatCOP(calculateTieredPrice(item, item.quantity).totalCop)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex justify-between font-heading font-bold">
        <span>Total</span>
        <span data-testid="checkout-total">{formatCOP(subtotalCop)}</span>
      </p>
      <div className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="customer_name">Nombre</Label>
          <Input id="customer_name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="customer_phone">Teléfono</Label>
          <Input id="customer_phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <WompiCheckoutButton customerName={name} customerPhone={phone} disabled={!canSubmit} />
        <WhatsAppCheckoutButton customerName={name} customerPhone={phone} disabled={!canSubmit} />
      </div>
    </div>
  );
}
