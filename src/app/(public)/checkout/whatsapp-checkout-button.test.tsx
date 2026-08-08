import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider } from "@/components/cart/cart-context";
import { WhatsAppCheckoutButton } from "./whatsapp-checkout-button";

const mockCreateWhatsAppOrder = vi.fn();
vi.mock("./actions", () => ({
  createWhatsAppOrder: (...args: unknown[]) => mockCreateWhatsAppOrder(...args),
}));

function seedCart() {
  localStorage.setItem(
    "crazyhour_cart",
    JSON.stringify([{ productId: "p1", name: "Piñata estrella", priceCop: 45000, imageUrl: null, quantity: 1 }])
  );
}

describe("WhatsAppCheckoutButton", () => {
  beforeEach(() => {
    localStorage.clear();
    mockCreateWhatsAppOrder.mockReset();
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  // vi.spyOn on an already-spied property reuses the same mock instance
  // (this vitest config has no clearMocks/restoreMocks), so without this
  // restore, test 2 sees test 1's recorded call.
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates the order, opens wa.me, and clears the cart", async () => {
    seedCart();
    mockCreateWhatsAppOrder.mockResolvedValue({ ok: true, orderId: "order-1", whatsappUrl: "https://wa.me/573000000000?text=hola" });
    const user = userEvent.setup();
    render(
      <CartProvider>
        <WhatsAppCheckoutButton customerName="Ana" customerPhone="3000000000" />
      </CartProvider>
    );
    await screen.findByText("Pedir por WhatsApp");

    await user.click(screen.getByText("Pedir por WhatsApp"));

    await waitFor(() => expect(window.open).toHaveBeenCalledWith("https://wa.me/573000000000?text=hola", "_blank", "noopener,noreferrer"));
    await waitFor(() => expect(screen.getByText(/te esperamos en whatsapp/i)).toBeInTheDocument());
  });

  it("shows the validation error without opening WhatsApp when the order fails", async () => {
    seedCart();
    mockCreateWhatsAppOrder.mockResolvedValue({
      ok: false,
      error: "Uno o más productos ya no están disponibles y se quitaron de tu carrito.",
      invalidProductIds: ["p1"],
    });
    const user = userEvent.setup();
    render(
      <CartProvider>
        <WhatsAppCheckoutButton customerName="Ana" customerPhone="3000000000" />
      </CartProvider>
    );
    await screen.findByText("Pedir por WhatsApp");

    await user.click(screen.getByText("Pedir por WhatsApp"));

    expect(await screen.findByText(/ya no están disponibles/)).toBeInTheDocument();
    expect(window.open).not.toHaveBeenCalled();
  });
});
