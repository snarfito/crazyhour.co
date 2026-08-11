import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartProvider } from "@/components/cart/cart-context";
import CheckoutPage from "./page";

vi.mock("./actions", () => ({
  createWompiOrder: vi.fn(),
  createWhatsAppOrder: vi.fn(),
}));

vi.mock("@/lib/settings", () => ({
  getActiveEventTheme: vi.fn().mockResolvedValue("none"),
}));

describe("CheckoutPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows an empty-cart message when there's nothing to check out", async () => {
    render(
      <CartProvider>
        {await CheckoutPage()}
      </CartProvider>
    );

    expect(screen.getByText(/carrito está vacío/i)).toBeInTheDocument();
  });

  it("shows the cart summary, total, and both channel buttons", async () => {
    localStorage.setItem(
      "crazyhour_cart",
      JSON.stringify([{ productId: "p1", name: "Piñata estrella", priceCop: 45000, imageUrl: null, quantity: 2 }])
    );
    render(
      <CartProvider>
        {await CheckoutPage()}
      </CartProvider>
    );

    expect(await screen.findByText("Piñata estrella")).toBeInTheDocument();
    // Scoped to the dedicated total element — the line total and the grand
    // total render the same formatted string for this single-item, qty-2
    // cart (2*45000 == subtotal), so an unscoped getByText would be ambiguous.
    expect(screen.getByTestId("checkout-total")).toHaveTextContent("$ 90.000");
    expect(screen.getByText("Pagar con Wompi")).toBeInTheDocument();
    expect(screen.getByText("Pedir por WhatsApp")).toBeInTheDocument();
  });
});
