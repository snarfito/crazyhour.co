import { describe, it, expect } from "vitest";
import { calculateTieredPrice, resolveEffectiveTiers, type ProductPricing } from "./pricing";

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
  });

  it("uses the fallback price for a pack1-only tier", () => {
    const result = calculateTieredPrice(pack1FallsBackToUnit, 10);
    expect(result.breakdown).toEqual([{ quantity: 10, unitPriceCop: 4000 }]);
    expect(result.totalCop).toBe(40000);
  });

  it("splits exactly on a qty that's a multiple of pack1_qty, no remainder lines", () => {
    const result = calculateTieredPrice(fullTiers, 20);
    expect(result.breakdown).toEqual([{ quantity: 20, unitPriceCop: 3000 }]);
    expect(result.totalCop).toBe(60000);
  });

  it("splits a remainder across all 3 tiers (qty=36, pack1_qty=10, pack2_qty=5)", () => {
    const result = calculateTieredPrice(fullTiers, 36);
    expect(result.breakdown).toEqual([
      { quantity: 30, unitPriceCop: 3000 },
      { quantity: 5, unitPriceCop: 3500 },
      { quantity: 1, unitPriceCop: 4000 },
    ]);
    expect(result.totalCop).toBe(30 * 3000 + 5 * 3500 + 1 * 4000);
  });

  it("cascades pack2's price through pack1 when splitting a remainder", () => {
    const result = calculateTieredPrice(pack2FallsBackToPack1, 7);
    // 0 packs of 10, 1 pack of 5 (falls back to pack1's 3000), 2 loose units at unit price.
    expect(result.breakdown).toEqual([
      { quantity: 5, unitPriceCop: 3000 },
      { quantity: 2, unitPriceCop: 4000 },
    ]);
    expect(result.totalCop).toBe(5 * 3000 + 2 * 4000);
  });
});
