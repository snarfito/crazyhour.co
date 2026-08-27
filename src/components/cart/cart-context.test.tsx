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
      <button
        onClick={() =>
          addItem(
            { productId: "p1", name: "Piñata", unitPriceCop: 45000, pack1Qty: null, pack1PriceCop: null, pack2Qty: null, pack2PriceCop: null, imageUrl: null },
            2
          )
        }
      >
        add p1
      </button>
      <button
        onClick={() =>
          addItem(
            { productId: "p1", name: "Piñata", unitPriceCop: 45000, pack1Qty: null, pack1PriceCop: null, pack2Qty: null, pack2PriceCop: null, imageUrl: null },
            1
          )
        }
      >
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

  it("adds items, merges quantity on repeat add, and computes totals via calculateTieredPrice", async () => {
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

  it("computes subtotal via calculateTieredPrice once a quantity reaches a wholesale tier", async () => {
    function TieredConsumer() {
      const { addItem, subtotalCop } = useCart();
      return (
        <div>
          <p data-testid="subtotal">{subtotalCop}</p>
          <button
            onClick={() =>
              addItem(
                { productId: "p2", name: "Globo", unitPriceCop: 4000, pack1Qty: 10, pack1PriceCop: 3000, pack2Qty: 5, pack2PriceCop: 3500, imageUrl: null },
                36
              )
            }
          >
            add p2 x36
          </button>
        </div>
      );
    }
    const user = userEvent.setup();
    render(
      <CartProvider>
        <TieredConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText("add p2 x36"));

    // qty=36 >= pack1_qty (10), so all 36 units price at pack1's 3000 — same threshold as pricing.test.ts's qty=36 case.
    expect(screen.getByTestId("subtotal")).toHaveTextContent(String(36 * 3000));
  });

  it("keeps two variants of the same product as separate lines, but merges a repeat of the same variant", async () => {
    function VariantConsumer() {
      const { items, addItem } = useCart();
      return (
        <div>
          <button
            onClick={() =>
              addItem(
                {
                  productId: "p3",
                  name: "Globo",
                  unitPriceCop: 3000,
                  pack1Qty: null,
                  pack1PriceCop: null,
                  pack2Qty: null,
                  pack2PriceCop: null,
                  imageUrl: null,
                  selectedOptions: [{ attributeId: "a1", optionId: "gold", attributeDisplayName: "Color", optionDisplayName: "Chrome Gold" }],
                },
                1
              )
            }
          >
            add gold
          </button>
          <button
            onClick={() =>
              addItem(
                {
                  productId: "p3",
                  name: "Globo",
                  unitPriceCop: 3000,
                  pack1Qty: null,
                  pack1PriceCop: null,
                  pack2Qty: null,
                  pack2PriceCop: null,
                  imageUrl: null,
                  selectedOptions: [{ attributeId: "a1", optionId: "silver", attributeDisplayName: "Color", optionDisplayName: "Chrome Silver" }],
                },
                1
              )
            }
          >
            add silver
          </button>
          <p data-testid="line-count">{items.length}</p>
          <ul>
            {items.map((item) => (
              <li key={item.cartItemId}>{item.cartItemId}: {item.quantity}</li>
            ))}
          </ul>
        </div>
      );
    }
    const user = userEvent.setup();
    render(
      <CartProvider>
        <VariantConsumer />
      </CartProvider>
    );

    await user.click(screen.getByText("add gold"));
    await user.click(screen.getByText("add silver"));
    await user.click(screen.getByText("add gold"));

    expect(screen.getByTestId("line-count")).toHaveTextContent("2");
    expect(screen.getByText("p3::gold: 2")).toBeInTheDocument();
    expect(screen.getByText("p3::silver: 1")).toBeInTheDocument();
  });

  it("normalizes a cart persisted before variants existed (no cartItemId/selectedOptions) on hydration", async () => {
    localStorage.setItem(
      "crazyhour_cart",
      JSON.stringify([{ productId: "p1", name: "Piñata", unitPriceCop: 45000, pack1Qty: null, pack1PriceCop: null, pack2Qty: null, pack2PriceCop: null, imageUrl: null, quantity: 2 }])
    );

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    await waitFor(() => expect(screen.getByText("Piñata: 2")).toBeInTheDocument());
    // setQuantity/removeItem are keyed by cartItemId — for a no-variant item that's just the productId.
    await userEvent.setup().click(screen.getByText("remove p1"));
    expect(screen.queryByText(/Piñata:/)).not.toBeInTheDocument();
  });

  it("useCart throws outside a CartProvider", () => {
    function Bare() {
      useCart();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(/CartProvider/);
  });
});
