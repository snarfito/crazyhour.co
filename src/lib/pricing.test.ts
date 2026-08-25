import { describe, it, expect } from "vitest";
import { calculateTieredPrice, resolveEffectiveTiers, formatTierBreakdown, type ProductPricing } from "./pricing";

const unitOnly: ProductPricing = {
  unitPriceCop: 4000,
  pack1Qty: null,
  pack1PriceCop: null,
  pack2Qty: null,
  pack2PriceCop: null,
};

const pack1FallsBackToUnit: ProductPricing = {
  unitPriceCop: 4000,
  pack1Qty: 10,
  pack1PriceCop: null,
  pack2Qty: null,
  pack2PriceCop: null,
};

const pack2FallsBackToPack1: ProductPricing = {
  unitPriceCop: 4000,
  pack1Qty: 10,
  pack1PriceCop: 3000,
  pack2Qty: 5,
  pack2PriceCop: null,
};

const fullTiers: ProductPricing = {
  unitPriceCop: 4000,
  pack1Qty: 10,
  pack1PriceCop: 3000,
  pack2Qty: 5,
  pack2PriceCop: 3500,
};

// The client's own example: unit 100, media paca (pack2) 10 un. @ 90, paca
// completa (pack1) 20 un. @ 80.
const clientExample: ProductPricing = {
  unitPriceCop: 100,
  pack1Qty: 20,
  pack1PriceCop: 80,
  pack2Qty: 10,
  pack2PriceCop: 90,
};

describe("resolveEffectiveTiers", () => {
  it("resolves pack1 to unit_price_cop when pack1_price_cop is null", () => {
    const tiers = resolveEffectiveTiers(pack1FallsBackToUnit);
    expect(tiers.pack1).toEqual({ qty: 10, unitPriceCop: 4000 });
    expect(tiers.pack2).toBeNull();
  });

  it("cascades pack2 to pack1's effective price when pack2_price_cop is null", () => {
    const tiers = resolveEffectiveTiers(pack2FallsBackToPack1);
    expect(tiers.pack2).toEqual({ qty: 5, unitPriceCop: 3000 });
  });

  it("cascades pack2 all the way to unit_price_cop when neither pack2_price_cop nor pack1 exist", () => {
    const tiers = resolveEffectiveTiers({
      unitPriceCop: 4000,
      pack1Qty: null,
      pack1PriceCop: null,
      pack2Qty: 5,
      pack2PriceCop: null,
    });
    expect(tiers.pack2).toEqual({ qty: 5, unitPriceCop: 4000 });
  });

  it("returns null for tiers with no qty", () => {
    const tiers = resolveEffectiveTiers(unitOnly);
    expect(tiers.pack1).toBeNull();
    expect(tiers.pack2).toBeNull();
  });
});

describe("calculateTieredPrice", () => {
  it("prices every unit at unit_price_cop when there are no pack tiers", () => {
    const result = calculateTieredPrice(unitOnly, 7);
    expect(result.breakdown).toEqual([{ quantity: 7, unitPriceCop: 4000 }]);
    expect(result.totalCop).toBe(28000);
    expect(result.appliedTier).toBe("unit");
  });

  it("uses the fallback price for a pack1-only tier once qty meets it", () => {
    const result = calculateTieredPrice(pack1FallsBackToUnit, 10);
    expect(result.breakdown).toEqual([{ quantity: 10, unitPriceCop: 4000 }]);
    expect(result.totalCop).toBe(40000);
    expect(result.appliedTier).toBe("pack1");
  });

  it("prices the whole quantity at unit_price_cop below every threshold (client example, qty=9)", () => {
    const result = calculateTieredPrice(clientExample, 9);
    expect(result.breakdown).toEqual([{ quantity: 9, unitPriceCop: 100 }]);
    expect(result.totalCop).toBe(900);
    expect(result.appliedTier).toBe("unit");
  });

  it("prices the whole quantity at pack2's price once it reaches pack2_qty (client example, qty=10)", () => {
    const result = calculateTieredPrice(clientExample, 10);
    expect(result.breakdown).toEqual([{ quantity: 10, unitPriceCop: 90 }]);
    expect(result.totalCop).toBe(900);
    expect(result.appliedTier).toBe("pack2");
  });

  it("keeps pricing the whole quantity at pack2's price up to pack1_qty (client example, qty=19)", () => {
    const result = calculateTieredPrice(clientExample, 19);
    expect(result.breakdown).toEqual([{ quantity: 19, unitPriceCop: 90 }]);
    expect(result.totalCop).toBe(1710);
    expect(result.appliedTier).toBe("pack2");
  });

  it("prices the whole quantity at pack1's price once it reaches pack1_qty (client example, qty=20)", () => {
    const result = calculateTieredPrice(clientExample, 20);
    expect(result.breakdown).toEqual([{ quantity: 20, unitPriceCop: 80 }]);
    expect(result.totalCop).toBe(1600);
    expect(result.appliedTier).toBe("pack1");
  });

  it("keeps pricing the whole quantity at pack1's price well past pack1_qty (client example, qty=25)", () => {
    const result = calculateTieredPrice(clientExample, 25);
    expect(result.breakdown).toEqual([{ quantity: 25, unitPriceCop: 80 }]);
    expect(result.totalCop).toBe(2000);
    expect(result.appliedTier).toBe("pack1");
  });

  it("prices the whole quantity at pack1's price for a qty that used to split across all 3 tiers (qty=36)", () => {
    const result = calculateTieredPrice(fullTiers, 36);
    expect(result.breakdown).toEqual([{ quantity: 36, unitPriceCop: 3000 }]);
    expect(result.totalCop).toBe(36 * 3000);
    expect(result.appliedTier).toBe("pack1");
  });

  it("cascades pack2's price through pack1 for a qty between pack2_qty and pack1_qty", () => {
    const result = calculateTieredPrice(pack2FallsBackToPack1, 7);
    expect(result.breakdown).toEqual([{ quantity: 7, unitPriceCop: 3000 }]);
    expect(result.totalCop).toBe(21000);
    expect(result.appliedTier).toBe("pack2");
  });
});

describe("formatTierBreakdown", () => {
  it("labels the paca completa tier", () => {
    expect(formatTierBreakdown("pack1")).toBe("Precio por paca completa");
  });

  it("labels the media paca tier", () => {
    expect(formatTierBreakdown("pack2")).toBe("Precio por media paca");
  });

  it("has nothing to say when only the base unit price applies", () => {
    expect(formatTierBreakdown("unit")).toBe("");
  });
});
