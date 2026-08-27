import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttributeSelector } from "./attribute-selector";
import type { ProductAttributeWithOptions } from "./product-attributes-types";

const COLOR_ATTR: ProductAttributeWithOptions = {
  id: "attr-color",
  kind: "color",
  displayName: "Color",
  affectsPrice: false,
  hasPhotos: true,
  options: [
    { id: "opt-gold", displayName: "Chrome Gold", colorHex: "#D4AF37", unitPriceCop: null, pack1PriceCop: null, pack2PriceCop: null, imageUrl: "https://example.com/gold.jpg" },
    { id: "opt-nohex", displayName: "Sin definir", colorHex: null, unitPriceCop: null, pack1PriceCop: null, pack2PriceCop: null, imageUrl: null },
  ],
};

describe("AttributeSelector", () => {
  it("shows the color circle and the option's name for a color group — never a photo thumbnail", () => {
    render(<AttributeSelector attributes={[COLOR_ATTR]} selected={{}} onSelect={vi.fn()} />);

    expect(screen.getByText("Chrome Gold")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    const swatch = screen.getByRole("button", { name: "Chrome Gold" }).querySelector("span");
    expect(swatch).toHaveStyle({ backgroundColor: "#D4AF37" });
  });

  it("falls back to a neutral swatch when the option has no color_hex, still showing its name", () => {
    render(<AttributeSelector attributes={[COLOR_ATTR]} selected={{}} onSelect={vi.fn()} />);

    expect(screen.getByText("Sin definir")).toBeInTheDocument();
  });

  it("calls onSelect with the attribute and option id when a color swatch is clicked", async () => {
    const onSelect = vi.fn();
    render(<AttributeSelector attributes={[COLOR_ATTR]} selected={{}} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: "Chrome Gold" }));

    expect(onSelect).toHaveBeenCalledWith("attr-color", "opt-gold");
  });

  it("marks the currently selected color as pressed", () => {
    render(<AttributeSelector attributes={[COLOR_ATTR]} selected={{ "attr-color": "opt-gold" }} onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Chrome Gold" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sin definir" })).toHaveAttribute("aria-pressed", "false");
  });
});
