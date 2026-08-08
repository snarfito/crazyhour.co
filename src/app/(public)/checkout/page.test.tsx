import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartProvider } from "@/components/cart/cart-context";
import CheckoutPage from "./page";

vi.mock("./actions", () => ({
  createWompiOrder: vi.fn(),
  createWhatsAppOrder: vi.fn(),
}));

describe("CheckoutPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows an empty-cart message when there's nothing to check out", () => {
    render(
      <CartProvider>
        <CheckoutPage />
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
        <CheckoutPage />
      </CartProvider>
    );

    expect(await screen.findByText("Piñata estrella")).toBeInTheDocument();
    expect(screen.getByText("$ 90.000")).toBeInTheDocument();
    expect(screen.getByText("Pagar con Wompi")).toBeInTheDocument();
    expect(screen.getByText("Pedir por WhatsApp")).toBeInTheDocument();
  });
});
