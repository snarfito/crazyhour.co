import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, type CartItem } from "@/components/cart/cart-context";
import CarritoPage from "./page";

function seedCart(items: CartItem[]) {
  localStorage.setItem("crazyhour_cart", JSON.stringify(items));
}

describe("CarritoPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows an empty-state message when the cart has no items", () => {
    render(
      <CartProvider>
        <CarritoPage />
      </CartProvider>
    );

    expect(screen.getByText(/carrito está vacío/i)).toBeInTheDocument();
  });

  it("lists items with quantity controls and a total, and lets you remove one", async () => {
    seedCart([
      { productId: "p1", name: "Piñata estrella", priceCop: 45000, imageUrl: null, quantity: 2 },
      { productId: "p2", name: "Globo metálico", priceCop: 5000, imageUrl: null, quantity: 1 },
    ]);
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CarritoPage />
      </CartProvider>
    );

    expect(await screen.findByText("Piñata estrella")).toBeInTheDocument();
    expect(screen.getByText("Globo metálico")).toBeInTheDocument();
    expect(screen.getByText("$ 95.000")).toBeInTheDocument(); // total: 2*45000 + 1*5000

    const removeButtons = screen.getAllByText("Quitar");
    await user.click(removeButtons[1]); // remove Globo metálico

    expect(screen.queryByText("Globo metálico")).not.toBeInTheDocument();
    expect(screen.getByText("$ 90.000")).toBeInTheDocument();
  });

  it("Continuar links to /checkout", async () => {
    seedCart([{ productId: "p1", name: "Piñata estrella", priceCop: 45000, imageUrl: null, quantity: 1 }]);
    render(
      <CartProvider>
        <CarritoPage />
      </CartProvider>
    );

    expect(await screen.findByRole("link", { name: "Continuar" })).toHaveAttribute("href", "/checkout");
  });
});
