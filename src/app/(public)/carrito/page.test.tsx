import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, type CartItem } from "@/components/cart/cart-context";
import CarritoPage from "./page";

vi.mock("@/lib/settings", () => ({
  getActiveEventTheme: vi.fn().mockResolvedValue("none"),
}));

vi.mock("@/lib/theme-settings", () => ({
  DEFAULT_MOTION_SETTINGS: {
    particleCount: 8, minDuration: 14, maxDuration: 22,
    minSize: 16, maxSize: 28, maxOpacity: 0.18, customCss: null,
  },
  getThemeMotionSettings: vi.fn().mockResolvedValue({
    particleCount: 8, minDuration: 14, maxDuration: 22,
    minSize: 16, maxSize: 28, maxOpacity: 0.18, customCss: null,
  }),
}));

function seedCart(items: CartItem[]) {
  localStorage.setItem("crazyhour_cart", JSON.stringify(items));
}

describe("CarritoPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows an empty-state message when the cart has no items", async () => {
    render(
      <CartProvider>
        {await CarritoPage()}
      </CartProvider>
    );

    expect(screen.getByText(/carrito está vacío/i)).toBeInTheDocument();
  });

  it("lists items with quantity controls and a total, and lets you remove one", async () => {
    seedCart([
      { productId: "p1", name: "Piñata estrella", unitPriceCop: 45000, pack1Qty: null, pack1PriceCop: null, pack2Qty: null, pack2PriceCop: null, imageUrl: null, quantity: 2 },
      { productId: "p2", name: "Globo metálico", unitPriceCop: 5000, pack1Qty: null, pack1PriceCop: null, pack2Qty: null, pack2PriceCop: null, imageUrl: null, quantity: 1 },
    ]);
    const user = userEvent.setup();
    render(
      <CartProvider>
        {await CarritoPage()}
      </CartProvider>
    );

    expect(await screen.findByText("Piñata estrella")).toBeInTheDocument();
    expect(screen.getByText("Globo metálico")).toBeInTheDocument();
    // total: 2*45000 + 1*5000. Scoped to the dedicated total element — a
    // per-line total can render the same formatted string (e.g. after the
    // removal below, the sole remaining line's total equals the grand
    // total), so an unscoped getByText on the number would be ambiguous.
    expect(screen.getByTestId("cart-total")).toHaveTextContent("$ 95.000");

    const removeButtons = screen.getAllByText("Quitar");
    await user.click(removeButtons[1]); // remove Globo metálico

    expect(screen.queryByText("Globo metálico")).not.toBeInTheDocument();
    expect(screen.getByTestId("cart-total")).toHaveTextContent("$ 90.000");
  });

  it("shows the paca/media-paca/loose-unit breakdown for items with tiered pricing", async () => {
    seedCart([
      {
        productId: "p1",
        name: "Globo por mayor",
        unitPriceCop: 4000,
        pack1Qty: 10,
        pack1PriceCop: 3000,
        pack2Qty: 5,
        pack2PriceCop: 3500,
        imageUrl: null,
        quantity: 16,
      },
    ]);
    render(
      <CartProvider>
        {await CarritoPage()}
      </CartProvider>
    );

    expect(await screen.findByText("1 paca + 1 media paca + 1 unidad")).toBeInTheDocument();
  });

  it("omits the breakdown line for items priced only per unit", async () => {
    seedCart([{ productId: "p1", name: "Piñata estrella", unitPriceCop: 45000, pack1Qty: null, pack1PriceCop: null, pack2Qty: null, pack2PriceCop: null, imageUrl: null, quantity: 2 }]);
    render(
      <CartProvider>
        {await CarritoPage()}
      </CartProvider>
    );

    await screen.findByText("Piñata estrella");
    expect(screen.queryByText(/paca|unidad/)).not.toBeInTheDocument();
  });

  it("Continuar links to /checkout", async () => {
    seedCart([{ productId: "p1", name: "Piñata estrella", unitPriceCop: 45000, pack1Qty: null, pack1PriceCop: null, pack2Qty: null, pack2PriceCop: null, imageUrl: null, quantity: 1 }]);
    render(
      <CartProvider>
        {await CarritoPage()}
      </CartProvider>
    );

    expect(await screen.findByRole("link", { name: "Continuar" })).toHaveAttribute("href", "/checkout");
  });
});
