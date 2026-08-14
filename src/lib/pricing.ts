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

/**
 * Greedy "coin change" split of a line's quantity across the resolved tiers
 * (design spec section 4): largest tier first, remainder into the next
 * tier, final remainder at unit_price_cop. `breakdown` maps 1:1 onto the
 * order_items rows a checkout confirmation inserts.
 */
export function calculateTieredPrice(
  product: ProductPricing,
  qty: number
): { breakdown: PriceBreakdownLine[]; totalCop: number } {
  const { unitPriceCop, pack1, pack2 } = resolveEffectiveTiers(product);

  const n1 = pack1 ? Math.floor(qty / pack1.qty) : 0;
  const rest1 = qty - n1 * (pack1?.qty ?? 0);
  const n2 = pack2 ? Math.floor(rest1 / pack2.qty) : 0;
  const rest2 = rest1 - n2 * (pack2?.qty ?? 0);

  const breakdown: PriceBreakdownLine[] = [];
  if (n1 > 0) breakdown.push({ quantity: n1 * pack1!.qty, unitPriceCop: pack1!.unitPriceCop });
  if (n2 > 0) breakdown.push({ quantity: n2 * pack2!.qty, unitPriceCop: pack2!.unitPriceCop });
  if (rest2 > 0) breakdown.push({ quantity: rest2, unitPriceCop });

  const totalCop = breakdown.reduce((sum, line) => sum + line.quantity * line.unitPriceCop, 0);
  return { breakdown, totalCop };
}
