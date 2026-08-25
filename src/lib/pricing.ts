export type ProductPricing = {
  unitPriceCop: number;
  pack1Qty: number | null;
  pack1PriceCop: number | null;
  pack2Qty: number | null;
  pack2PriceCop: number | null;
};

export type PriceBreakdownLine = {
  quantity: number;
  unitPriceCop: number;
};

type ResolvedTier = { qty: number; unitPriceCop: number } | null;

/**
 * Resolves the cascading price fallback (design spec section 3), once per
 * product, independent of any specific quantity:
 *  - pack1 with no pack1_price_cop falls back to unit_price_cop.
 *  - pack2 with no pack2_price_cop falls back to pack1's effective price if
 *    pack1 exists, otherwise to unit_price_cop.
 */
export function resolveEffectiveTiers(product: ProductPricing): {
  unitPriceCop: number;
  pack1: ResolvedTier;
  pack2: ResolvedTier;
} {
  const pack1: ResolvedTier =
    product.pack1Qty != null
      ? { qty: product.pack1Qty, unitPriceCop: product.pack1PriceCop ?? product.unitPriceCop }
      : null;
  const pack2: ResolvedTier =
    product.pack2Qty != null
      ? { qty: product.pack2Qty, unitPriceCop: product.pack2PriceCop ?? pack1?.unitPriceCop ?? product.unitPriceCop }
      : null;
  return { unitPriceCop: product.unitPriceCop, pack1, pack2 };
}

export type AppliedTier = "pack1" | "pack2" | "unit";

/**
 * Threshold pricing: once qty reaches a tier's minimum, that tier's price
 * applies to the ENTIRE quantity (client clarification, 25 ago) — this is
 * not a split of qty across tiers. pack1 (paca completa) is checked before
 * pack2 (media paca) since the DB enforces pack1_qty > pack2_qty.
 * `breakdown` stays a single-line array so it still maps onto an
 * order_items row a checkout confirmation inserts.
 */
export function calculateTieredPrice(
  product: ProductPricing,
  qty: number
): { breakdown: PriceBreakdownLine[]; totalCop: number; appliedTier: AppliedTier } {
  const { unitPriceCop, pack1, pack2 } = resolveEffectiveTiers(product);

  let appliedTier: AppliedTier = "unit";
  let price = unitPriceCop;
  if (pack1 && qty >= pack1.qty) {
    appliedTier = "pack1";
    price = pack1.unitPriceCop;
  } else if (pack2 && qty >= pack2.qty) {
    appliedTier = "pack2";
    price = pack2.unitPriceCop;
  }

  return {
    breakdown: [{ quantity: qty, unitPriceCop: price }],
    totalCop: qty * price,
    appliedTier,
  };
}

/**
 * Label for which wholesale tier kicked in — shared by the product page and
 * the cart so both show the same wording. Nothing to call out at the base
 * unit price.
 */
export function formatTierBreakdown(appliedTier: AppliedTier): string {
  if (appliedTier === "pack1") return "Precio por paca completa";
  if (appliedTier === "pack2") return "Precio por media paca";
  return "";
}
