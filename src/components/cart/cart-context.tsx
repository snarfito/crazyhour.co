"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { calculateTieredPrice, type ProductPricing } from "@/lib/pricing";

export type CartItem = ProductPricing & {
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  itemCount: number;
  subtotalCop: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "crazyhour_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Server always renders an empty cart (no localStorage access during
  // SSR) — hydrate from localStorage only after mount, and only start
  // persisting writes back once that initial read has happened, so we
  // never clobber a stored cart with the empty initial state.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Synchronous setState here (not an async/deferred one) is what keeps
      // the client's FIRST render matching the server's empty-cart render,
      // avoiding a hydration mismatch. A lazy useState initializer was tried
      // instead and reintroduces exactly that mismatch (see git history /
      // review notes) — do not "fix" this lint warning by switching back to
      // that pattern.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional, see comment above
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupted localStorage value — start from an empty cart.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(item: Omit<CartItem, "quantity">, quantity: number) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { ...item, quantity }];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function setQuantity(productId: string, quantity: number) {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }

  function clear() {
    setItems([]);
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalCop = items.reduce((sum, i) => sum + calculateTieredPrice(i, i.quantity).totalCop, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clear, itemCount, subtotalCop }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de un CartProvider.");
  return ctx;
}
