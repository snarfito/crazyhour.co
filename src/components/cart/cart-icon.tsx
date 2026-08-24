"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./cart-context";

export function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Link href="/carrito" className="relative flex items-center gap-1.5 text-foreground">
      <ShoppingCart className="h-5 w-5" />
      <span className="text-sm font-semibold">Carrito</span>
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
