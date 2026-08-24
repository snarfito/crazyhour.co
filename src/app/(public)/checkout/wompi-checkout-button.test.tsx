import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider } from "@/components/cart/cart-context";
import { WompiCheckoutButton } from "./wompi-checkout-button";

const mockCreateWompiOrder = vi.fn();
vi.mock("./actions", () => ({
  createWompiOrder: (...args: unknown[]) => mockCreateWompiOrder(...args),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function seedCart() {
  localStorage.setItem(
    "crazyhour_cart",
    JSON.stringify([{ productId: "p1", name: "Piñata estrella", unitPriceCop: 45000, pack1Qty: null, pack1PriceCop: null, pack2Qty: null, pack2PriceCop: null, imageUrl: null, quantity: 1 }])
  );
}

describe("WompiCheckoutButton", () => {
  beforeEach(() => {
    localStorage.clear();
    mockCreateWompiOrder.mockReset();
    mockPush.mockReset();
    window.WidgetCheckout = vi.fn().mockImplementation(function () {
      return { open: (cb: (r: unknown) => void) => cb({ transaction: { status: "APPROVED" } }) };
    });
  });

  it("creates the order, then opens the Wompi widget, clears the cart, and redirects to /checkout/gracias once approved", async () => {
    seedCart();
    mockCreateWompiOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      reference: "order-1",
      amountInCents: 4500000,
      currency: "COP",
      signature: "sig",
      publicKey: "pub_test_xxx",
    });
    const user = userEvent.setup();
    render(
      <CartProvider>
        <WompiCheckoutButton customerName="Ana" customerPhone="3000000000" />
      </CartProvider>
    );
    await screen.findByText("Pagar con Wompi"); // wait for cart hydration

    await user.click(screen.getByText("Pagar con Wompi"));

    await waitFor(() => expect(mockCreateWompiOrder).toHaveBeenCalledWith({ name: "Ana", phone: "3000000000" }, [{ productId: "p1", quantity: 1 }]));
    await waitFor(() => expect(window.WidgetCheckout).toHaveBeenCalled());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/checkout/gracias?ref=order-1"));
    expect(JSON.parse(localStorage.getItem("crazyhour_cart")!)).toEqual([]);
  });

  it("keeps the cart and does not redirect when the transaction is declined", async () => {
    window.WidgetCheckout = vi.fn().mockImplementation(function () {
      return { open: (cb: (r: unknown) => void) => cb({ transaction: { status: "DECLINED" } }) };
    });
    seedCart();
    mockCreateWompiOrder.mockResolvedValue({
      ok: true,
      orderId: "order-1",
      reference: "order-1",
      amountInCents: 4500000,
      currency: "COP",
      signature: "sig",
      publicKey: "pub_test_xxx",
    });
    const user = userEvent.setup();
    render(
      <CartProvider>
        <WompiCheckoutButton customerName="Ana" customerPhone="3000000000" />
      </CartProvider>
    );
    await screen.findByText("Pagar con Wompi");

    await user.click(screen.getByText("Pagar con Wompi"));

    await waitFor(() => expect(window.WidgetCheckout).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("crazyhour_cart")!)).toHaveLength(1);
  });

  it("shows the validation error and does not open the widget when the order fails", async () => {
    seedCart();
    mockCreateWompiOrder.mockResolvedValue({
      ok: false,
      error: "Uno o más productos ya no están disponibles y se quitaron de tu carrito.",
      invalidProductIds: ["p1"],
    });
    const user = userEvent.setup();
    render(
      <CartProvider>
        <WompiCheckoutButton customerName="Ana" customerPhone="3000000000" />
      </CartProvider>
    );
    await screen.findByText("Pagar con Wompi");

    await user.click(screen.getByText("Pagar con Wompi"));

    expect(await screen.findByText(/ya no están disponibles/)).toBeInTheDocument();
    expect(window.WidgetCheckout).not.toHaveBeenCalled();
  });
});
