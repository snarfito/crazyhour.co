import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "@/components/cart/cart-context";
import { ProductPurchasePanel } from "./product-purchase-panel";
import type { ProductAttributeWithOptions } from "./product-attributes-types";

const COLOR_ATTR: ProductAttributeWithOptions = {
  id: "attr-color",
  kind: "color",
  displayName: "Color",
  affectsPrice: false,
  hasPhotos: true,
  // Silver first (no photo) so the default preselection keeps the gallery
  // on the product's own default image — tests that need to see the swap
  // explicitly click "Chrome Gold" (second option, has its own photo).
  options: [
    { id: "opt-silver", displayName: "Chrome Silver", colorHex: "#C0C0C0", unitPriceCop: null, pack1PriceCop: null, pack2PriceCop: null, imageUrl: null },
    { id: "opt-gold", displayName: "Chrome Gold", colorHex: "#D4AF37", unitPriceCop: null, pack1PriceCop: null, pack2PriceCop: null, imageUrl: "https://example.com/gold.jpg" },
  ],
};

const SIZE_ATTR: ProductAttributeWithOptions = {
  id: "attr-size",
  kind: "size",
  displayName: "Talla",
  affectsPrice: true,
  hasPhotos: false,
  options: [
    { id: "opt-18", displayName: "18 pulgadas", colorHex: null, unitPriceCop: 3000, pack1PriceCop: 2000, pack2PriceCop: null, imageUrl: null },
    { id: "opt-36", displayName: "36 pulgadas", colorHex: null, unitPriceCop: 8000, pack1PriceCop: null, pack2PriceCop: null, imageUrl: null },
  ],
};

const baseProps = {
  productId: "p1",
  name: "Globo metalizado",
  description: null,
  images: [
    { url: "https://example.com/default.jpg", alt: "Globo metalizado" },
    { url: "https://example.com/gold.jpg", alt: "Globo metalizado" },
  ],
  unitPriceCop: 1000,
  pack1Qty: null,
  pack1PriceCop: null,
  pack2Qty: null,
  pack2PriceCop: null,
};

function CartDebug() {
  const { items } = useCart();
  return <p data-testid="cart-items">{JSON.stringify(items)}</p>;
}

describe("ProductPurchasePanel", () => {
  it("preselects the first option of every group on load, so Agregar al carrito starts enabled", () => {
    render(
      <CartProvider>
        <ProductPurchasePanel {...baseProps} attributes={[COLOR_ATTR, SIZE_ATTR]} />
      </CartProvider>
    );

    expect(screen.getByText("Agregar al carrito")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Chrome Silver" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /18 pulgadas/ })).toHaveAttribute("aria-pressed", "true");
    // 18 pulgadas is the first size option, so its price shows immediately.
    expect(screen.getByText("$ 3.000 c/u")).toBeInTheDocument();
  });

  it("shows a validation message and keeps the button disabled when a group has no options at all", () => {
    const emptyGroup: ProductAttributeWithOptions = { ...SIZE_ATTR, id: "attr-empty", displayName: "Sabor", options: [] };
    render(
      <CartProvider>
        <ProductPurchasePanel {...baseProps} attributes={[emptyGroup]} />
      </CartProvider>
    );

    expect(screen.getByText("Agregar al carrito")).toBeDisabled();
    expect(screen.getByText(/elige una opción de: sabor/i)).toBeInTheDocument();
  });

  it("changes the price when picking a different option of the price-driving attribute", async () => {
    render(
      <CartProvider>
        <ProductPurchasePanel {...baseProps} attributes={[COLOR_ATTR, SIZE_ATTR]} />
      </CartProvider>
    );

    expect(screen.getByText("$ 3.000 c/u")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /36 pulgadas/ }));

    expect(screen.getByText("$ 8.000 c/u")).toBeInTheDocument();
    expect(screen.queryByText("$ 3.000 c/u")).not.toBeInTheDocument();
  });

  it("shows the paca completa price from the OPTION, ignoring the product's own pack1_price_cop", async () => {
    render(
      <CartProvider>
        <ProductPurchasePanel
          {...baseProps}
          pack1Qty={10}
          pack1PriceCop={999999} // trampa: debe ignorarse por completo
          attributes={[COLOR_ATTR, SIZE_ATTR]}
        />
      </CartProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: /18 pulgadas/ }));

    expect(screen.getByText(/Paca completa \(10 un\.\)/)).toHaveTextContent("$ 2.000");
    expect(screen.queryByText(/999\.999/)).not.toBeInTheDocument();
  });

  it("swaps the gallery's main image when a color option with its own photo is selected", async () => {
    render(
      <CartProvider>
        <ProductPurchasePanel {...baseProps} attributes={[COLOR_ATTR, SIZE_ATTR]} />
      </CartProvider>
    );

    expect(screen.getByTestId("gallery-main-image")).toHaveAttribute("src", expect.stringContaining("default.jpg"));

    await userEvent.click(screen.getByRole("button", { name: "Chrome Gold" }));

    expect(screen.getByTestId("gallery-main-image").getAttribute("src")).toContain("gold.jpg");
  });

  it("adds to the cart with the resolved price and the full selection", async () => {
    render(
      <CartProvider>
        <ProductPurchasePanel {...baseProps} attributes={[COLOR_ATTR, SIZE_ATTR]} />
        <CartDebug />
      </CartProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Chrome Gold" }));
    await userEvent.click(screen.getByRole("button", { name: /18 pulgadas/ }));
    await userEvent.click(screen.getByText("Agregar al carrito"));

    await waitFor(() => {
      const items = JSON.parse(screen.getByTestId("cart-items").textContent!);
      expect(items).toHaveLength(1);
      expect(items[0].unitPriceCop).toBe(3000);
      expect(items[0].selectedOptions).toEqual([
        { attributeId: "attr-color", optionId: "opt-gold", attributeDisplayName: "Color", optionDisplayName: "Chrome Gold" },
        { attributeId: "attr-size", optionId: "opt-18", attributeDisplayName: "Talla", optionDisplayName: "18 pulgadas" },
      ]);
    });
  });

  it("renders no selectors and an enabled button for a product without attributes", () => {
    render(
      <CartProvider>
        <ProductPurchasePanel {...baseProps} attributes={[]} />
      </CartProvider>
    );

    expect(screen.getByText("Agregar al carrito")).toBeEnabled();
    expect(screen.queryByText("Color")).not.toBeInTheDocument();
  });
});
