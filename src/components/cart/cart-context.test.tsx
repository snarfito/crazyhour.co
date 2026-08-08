import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "./cart-context";

function TestConsumer() {
  const { items, addItem, removeItem, setQuantity, clear, itemCount, subtotalCop } = useCart();
  return (
    <div>
      <p data-testid="count">{itemCount}</p>
      <p data-testid="subtotal">{subtotalCop}</p>
      <button onClick={() => addItem({ productId: "p1", name: "Piñata", priceCop: 45000, imageUrl: null }, 2)}>
        add p1
      </button>
      <button onClick={() => addItem({ productId: "p1", name: "Piñata", priceCop: 45000, imageUrl: null }, 1)}>
        add p1 again
      </button>
      <button onClick={() => setQuantity("p1", 5)}>set p1 to 5</button>
      <button onClick={() => setQuantity("p1", 0)}>zero p1</button>
      <button onClick={() => removeItem("p1")}>remove p1</button>
      <button onClick={() => clear()}>clear</button>
      <ul>
        {items.map((item) => (
          <li key={item.productId}>{item.name}: {item.quantity}</li>
        ))}
      </ul>
    </div>
  );
}

describe("CartProvider / useCart", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds items, merges quantity on repeat add, and computes totals", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText("add p1"));
    await user.click(screen.getByText("add p1 again"));

    expect(screen.getByText("Piñata: 3")).toBeInTheDocument();
    expect(screen.getByTestId("count")).toHaveTextContent("3");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("135000");
  });

  it("setQuantity below 1 removes the item", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText("add p1"));
    await user.click(screen.getByText("zero p1"));

    expect(screen.queryByText(/Piñata:/)).not.toBeInTheDocument();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("persists to localStorage and rehydrates on next mount", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );
    await user.click(screen.getByText("add p1"));
    await waitFor(() => expect(localStorage.getItem("crazyhour_cart")).toContain("p1"));
    unmount();

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    await waitFor(() => expect(screen.getByText("Piñata: 2")).toBeInTheDocument());
  });

  it("clear empties the cart", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );
    await user.click(screen.getByText("add p1"));
    await user.click(screen.getByText("clear"));

    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("useCart throws outside a CartProvider", () => {
    function Bare() {
      useCart();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(/CartProvider/);
  });
});
