import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartProvider } from "@/components/cart/cart-context";
import CheckoutPage from "./page";

vi.mock("./actions", () => ({
  createWompiOrder: vi.fn(),
  createWhatsAppOrder: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

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
      JSON.stringify([{ productId: "p1", name: "Piñata estrella", unitPriceCop: 45000, pack1Qty: null, pack1PriceCop: null, pack2Qty: null, pack2PriceCop: null, imageUrl: null, quantity: 2 }])
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
    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
    expect(screen.getByLabelText("Dirección")).toBeInTheDocument();
    expect(screen.getByLabelText("Barrio")).toBeInTheDocument();
    expect(screen.getByLabelText("Ciudad")).toBeInTheDocument();
    expect(screen.getByLabelText(/información adicional/i)).toBeInTheDocument();
  });

  it("disables the WhatsApp button and shows an error while the phone is malformed", async () => {
    localStorage.setItem(
      "crazyhour_cart",
      JSON.stringify([{ productId: "p1", name: "Piñata estrella", unitPriceCop: 45000, pack1Qty: null, pack1PriceCop: null, pack2Qty: null, pack2PriceCop: null, imageUrl: null, quantity: 1 }])
    );
    render(
      <CartProvider>
        {await CheckoutPage()}
      </CartProvider>
    );

    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@example.com" } });
    fireEvent.change(screen.getByLabelText("Dirección"), { target: { value: "Calle 1" } });
    fireEvent.change(screen.getByLabelText("Barrio"), { target: { value: "Chapinero" } });
    fireEvent.change(screen.getByLabelText("Ciudad"), { target: { value: "Bogotá" } });

    expect(screen.getByText(/celular colombiano válido/i)).toBeInTheDocument();
    expect(screen.getByText("Pedir por WhatsApp").closest("button")).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Teléfono"), { target: { value: "3001234567" } });

    expect(screen.queryByText(/celular colombiano válido/i)).not.toBeInTheDocument();
    expect(screen.getByText("Pedir por WhatsApp").closest("button")).not.toBeDisabled();
  });
});
