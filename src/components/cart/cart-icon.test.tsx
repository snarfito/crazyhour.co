import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartProvider } from "./cart-context";
import { CartIcon } from "./cart-icon";

describe("CartIcon", () => {
  it("links to /carrito and hides the badge when the cart is empty", () => {
    render(
      <CartProvider>
        <CartIcon />
      </CartProvider>
    );

    const link = screen.getByRole("link", { name: /carrito/i });
    expect(link).toHaveAttribute("href", "/carrito");
    expect(screen.queryByTestId("cart-count")).not.toBeInTheDocument();
  });
});
