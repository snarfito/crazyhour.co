"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { formatCOP } from "@/lib/format";
import { calculateTieredPrice } from "@/lib/pricing";
import { isValidCOPhone } from "@/lib/phone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WompiCheckoutButton } from "./wompi-checkout-button";
import { WhatsAppCheckoutButton } from "./whatsapp-checkout-button";

export function CheckoutPageClient() {
  const { items, subtotalCop } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [extra, setExtra] = useState("");

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

  const phoneError = phone.trim().length > 0 && !isValidCOPhone(phone);

  const canSubmit =
    name.trim().length > 0 &&
    isValidCOPhone(phone) &&
    email.trim().length > 0 &&
    address.trim().length > 0 &&
    neighborhood.trim().length > 0 &&
    city.trim().length > 0;

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="text-glow font-heading text-2xl font-extrabold">Datos de envío</h1>
      <div className="neon-border mt-4 rounded-2xl border border-border bg-card/55 p-4">
        <ul className="divide-y divide-border/60">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between py-2 text-sm text-muted-foreground">
              <span>
                {item.quantity}x <span>{item.name}</span>
              </span>
              <span>{formatCOP(calculateTieredPrice(item, item.quantity).totalCop)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex justify-between border-t border-dashed border-border/60 pt-2 font-heading font-bold">
          <span>Total</span>
          <span data-testid="checkout-total" className="text-glow text-brand-green">
            {formatCOP(subtotalCop)}
          </span>
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="customer_name" className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Nombre
          </Label>
          <Input id="customer_name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="customer_phone" className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Teléfono
          </Label>
          <Input
            id="customer_phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={phoneError}
            required
          />
          {phoneError && (
            <p className="mt-1 text-xs text-destructive">
              El teléfono debe ser un celular colombiano válido (10 dígitos, empieza en 3).
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="customer_email" className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Correo
          </Label>
          <Input id="customer_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="shipping_address" className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Dirección
          </Label>
          <Input id="shipping_address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="shipping_neighborhood" className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Barrio
          </Label>
          <Input id="shipping_neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="shipping_city" className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Ciudad
          </Label>
          <Input id="shipping_city" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="shipping_extra" className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Información adicional (apto, casa, torre, etc.)
          </Label>
          <Input id="shipping_extra" value={extra} onChange={(e) => setExtra(e.target.value)} />
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <WompiCheckoutButton
          customerName={name}
          customerPhone={phone}
          customerEmail={email}
          customerAddress={address}
          customerNeighborhood={neighborhood}
          customerCity={city}
          customerExtra={extra}
          disabled={!canSubmit}
        />
        <WhatsAppCheckoutButton
          customerName={name}
          customerPhone={phone}
          customerEmail={email}
          customerAddress={address}
          customerNeighborhood={neighborhood}
          customerCity={city}
          customerExtra={extra}
          disabled={!canSubmit}
        />
        {!canSubmit && (
          <p className="text-center text-xs text-muted-foreground">
            Los botones se activan cuando el teléfono es válido.
          </p>
        )}
      </div>
    </div>
  );
}
