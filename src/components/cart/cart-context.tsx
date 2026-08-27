"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { calculateTieredPrice, type ProductPricing } from "@/lib/pricing";

export type SelectedOption = {
  attributeId: string;
  optionId: string;
  attributeDisplayName: string;
  optionDisplayName: string;
};

export type CartItem = ProductPricing & {
  /** Identifica una línea del carrito: el productId solo, o productId + las opciones elegidas (dos variantes del mismo producto son líneas distintas). */
  cartItemId: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  selectedOptions: SelectedOption[];
};

type AddItemInput = Omit<CartItem, "quantity" | "cartItemId" | "selectedOptions"> & {
  selectedOptions?: SelectedOption[];
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: AddItemInput, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  /** Quita toda línea de este producto, sin importar la variante — para cuando el servidor rechaza un productId completo (ver checkout buttons). */
  removeItemsByProductId: (productId: string) => void;
  setQuantity: (cartItemId: string, quantity: number) => void;
  clear: () => void;
  itemCount: number;
  subtotalCop: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "crazyhour_cart";

function buildCartItemId(productId: string, selectedOptions: SelectedOption[]): string {
  if (selectedOptions.length === 0) return productId;
  const optionIds = selectedOptions.map((o) => o.optionId).sort().join(",");
  return `${productId}::${optionIds}`;
}

/** Un carrito guardado antes de esta funcionalidad no tiene cartItemId/selectedOptions — se rellenan al hidratar. */
export type StoredCartItem = Omit<CartItem, "cartItemId" | "selectedOptions"> & Partial<Pick<CartItem, "cartItemId" | "selectedOptions">>;

function normalizeCartItem(item: StoredCartItem): CartItem {
  const selectedOptions = item.selectedOptions ?? [];
  return { ...item, selectedOptions, cartItemId: item.cartItemId ?? buildCartItemId(item.productId, selectedOptions) };
}

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
      if (raw) setItems((JSON.parse(raw) as StoredCartItem[]).map(normalizeCartItem));
    } catch {
      // Corrupted localStorage value — start from an empty cart.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(item: AddItemInput, quantity: number) {
    const selectedOptions = item.selectedOptions ?? [];
    const cartItemId = buildCartItemId(item.productId, selectedOptions);
    setItems((prev) => {
      const existing = prev.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { ...item, selectedOptions, cartItemId, quantity }];
    });
  }

  function removeItem(cartItemId: string) {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }

  function removeItemsByProductId(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function setQuantity(cartItemId: string, quantity: number) {
    if (quantity < 1) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity } : i)));
  }

  function clear() {
    setItems([]);
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalCop = items.reduce((sum, i) => sum + calculateTieredPrice(i, i.quantity).totalCop, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, removeItemsByProductId, setQuantity, clear, itemCount, subtotalCop }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de un CartProvider.");
  return ctx;
}
