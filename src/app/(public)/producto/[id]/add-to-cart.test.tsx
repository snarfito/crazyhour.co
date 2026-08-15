import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "@/components/cart/cart-context";
import { AddToCart } from "./add-to-cart";

function CartDebug() {
  const { items } = useCart();
  return <p data-testid="items">{JSON.stringify(items)}</p>;
}

const baseProps = {
  productId: "p1",
  name: "Piñata estrella",
  unitPriceCop: 45000,
  pack1Qty: null,
  pack1PriceCop: null,
  pack2Qty: null,
  pack2PriceCop: null,
};

describe("AddToCart", () => {
  it("adds the selected quantity to the cart", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <AddToCart {...baseProps} imageUrl="https://example.com/p1.jpg" />
        <CartDebug />
      </CartProvider>
    );

    await user.click(screen.getByLabelText("Sumar"));
    await user.click(screen.getByText("Agregar al carrito"));

    await waitFor(() => {
      expect(screen.getByTestId("items")).toHaveTextContent(
        JSON.stringify([{ ...baseProps, imageUrl: "https://example.com/p1.jpg", quantity: 2 }])
      );
    });
  });

  it("recalculates the total price as the quantity changes using pack pricing", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <AddToCart
          productId="p2"
          name="Globo por mayor"
          unitPriceCop={4000}
          pack1Qty={10}
          pack1PriceCop={3000}
          pack2Qty={5}
          pack2PriceCop={3500}
          imageUrl={null}
        />
      </CartProvider>
    );

    expect(screen.getByText(/Total \(1 un\.\)/)).toHaveTextContent("$ 4.000");

    const input = screen.getByLabelText("Cantidad");
    await user.clear(input);
    await user.type(input, "10");
    await user.tab();

    expect(screen.getByText(/Total \(10 un\.\)/)).toHaveTextContent("$ 30.000");
  });

  it("shows a confirmation on the button after adding", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <AddToCart {...baseProps} imageUrl={null} />
      </CartProvider>
    );

    await user.click(screen.getByText("Agregar al carrito"));

    expect(screen.getByText("Agregado ✓")).toBeInTheDocument();
  });
});
