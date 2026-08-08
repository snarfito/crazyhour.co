"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./cart-context";

export function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Link href="/carrito" aria-label="Carrito" className="relative">
      <ShoppingCart className="h-5 w-5 text-muted-foreground" />
      {itemCount > 0 && (
        <span
          data-testid="cart-count"
          className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
        >
          {itemCount}
        </span>
      )}
    </Link>
  );
}
