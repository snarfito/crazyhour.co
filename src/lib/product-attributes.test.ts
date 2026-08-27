import { describe, it, expect } from "vitest";
import { resolveProductSelection } from "./product-attributes";

const COLOR = { id: "attr-color", displayName: "Color", affectsPrice: false };
const SIZE = { id: "attr-size", displayName: "Talla", affectsPrice: true };

const GOLD = { id: "opt-gold", attributeId: "attr-color", displayName: "Chrome Gold", unitPriceCop: null, pack1PriceCop: null, pack2PriceCop: null };
const SILVER = { id: "opt-silver", attributeId: "attr-color", displayName: "Chrome Silver", unitPriceCop: null, pack1PriceCop: null, pack2PriceCop: null };
const SIZE_18 = { id: "opt-18", attributeId: "attr-size", displayName: "18 pulgadas", unitPriceCop: 3000, pack1PriceCop: 2500, pack2PriceCop: 2800 };
const SIZE_36 = { id: "opt-36", attributeId: "attr-size", displayName: "36 pulgadas", unitPriceCop: 8000, pack1PriceCop: null, pack2PriceCop: null };
const SIZE_NO_PRICE = { id: "opt-nop", attributeId: "attr-size", displayName: "Sin precio", unitPriceCop: null, pack1PriceCop: null, pack2PriceCop: null };

describe("resolveProductSelection", () => {
  it("returns no price override and empty summary for a product without attributes", () => {
    const result = resolveProductSelection([], [], []);
    expect(result).toEqual({
      ok: true,
      result: { priceOverride: null, summary: "", selections: [] },
    });
  });

  it("resolves the full price override (unit + pack tiers) from the price-driving attribute's selected option", () => {
    const result = resolveProductSelection(
      [COLOR, SIZE],
      [GOLD, SILVER, SIZE_18, SIZE_36],
      [GOLD.id, SIZE_18.id]
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.priceOverride).toEqual({ unitPriceCop: 3000, pack1PriceCop: 2500, pack2PriceCop: 2800 });
    expect(result.result.summary).toBe("Color: Chrome Gold · Talla: 18 pulgadas");
    expect(result.result.selections).toEqual([
      { attributeId: "attr-color", optionId: "opt-gold", attributeDisplayName: "Color", optionDisplayName: "Chrome Gold" },
      { attributeId: "attr-size", optionId: "opt-18", attributeDisplayName: "Talla", optionDisplayName: "18 pulgadas" },
    ]);
  });

  it("leaves pack1/pack2 price null in the override when the option has no price of its own for that tier", () => {
    const result = resolveProductSelection([SIZE], [SIZE_36], [SIZE_36.id]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.priceOverride).toEqual({ unitPriceCop: 8000, pack1PriceCop: null, pack2PriceCop: null });
  });

  it("leaves priceOverride null when no attribute affects price", () => {
    const result = resolveProductSelection([COLOR], [GOLD, SILVER], [GOLD.id]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.priceOverride).toBeNull();
    expect(result.result.summary).toBe("Color: Chrome Gold");
  });

  it("rejects a missing selection for a required attribute", () => {
    const result = resolveProductSelection([COLOR, SIZE], [GOLD, SIZE_18], [GOLD.id]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/Talla/);
  });

  it("rejects an option id that doesn't exist", () => {
    const result = resolveProductSelection([COLOR], [GOLD], ["does-not-exist"]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/inválida/i);
  });

  it("rejects two selected options for the same attribute", () => {
    const result = resolveProductSelection([COLOR], [GOLD, SILVER], [GOLD.id, SILVER.id]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/una opción por grupo/i);
  });

  it("rejects when the price-driving option has no unit price configured", () => {
    const result = resolveProductSelection([SIZE], [SIZE_NO_PRICE], [SIZE_NO_PRICE.id]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/precio configurado/i);
  });

  it("rejects an option whose attribute isn't in the product's attribute list", () => {
    const foreignOption = {
      id: "opt-foreign",
      attributeId: "attr-other-product",
      displayName: "x",
      unitPriceCop: null,
      pack1PriceCop: null,
      pack2PriceCop: null,
    };
    const result = resolveProductSelection([COLOR], [GOLD, foreignOption], [foreignOption.id]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/inválida/i);
  });
});
