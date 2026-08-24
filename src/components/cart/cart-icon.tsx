"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./cart-context";

export function CartIcon() {
  const { itemCount } = useCart();
  const [bump, setBump] = useState(false);
  const prevCount = useRef(itemCount);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Skips the localStorage hydration jump (0 -> N right after mount),
    // which would otherwise bump on page load instead of on an actual add.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      prevCount.current = itemCount;
      return;
    }
    if (itemCount > prevCount.current) {
      setBump(true);
      const timeout = setTimeout(() => setBump(false), 300);
      prevCount.current = itemCount;
      return () => clearTimeout(timeout);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  return (
    <Link href="/carrito" className="relative flex items-center gap-1.5 text-foreground">
      <ShoppingCart className={`h-5 w-5 ${bump ? "animate-cart-bump" : ""}`} />
      <span className="text-sm font-semibold">Carrito</span>
      {itemCount > 0 && (
        <span
          data-testid="cart-count"
          className={`absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ${bump ? "animate-cart-bump" : ""}`}
        >
          {itemCount}
        </span>
      )}
    </Link>
  );
}
