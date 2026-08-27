export type AttributeForSelection = {
  id: string;
  displayName: string;
  affectsPrice: boolean;
};

export type OptionForSelection = {
  id: string;
  attributeId: string;
  displayName: string;
  unitPriceCop: number | null;
  pack1PriceCop: number | null;
  pack2PriceCop: number | null;
};

export type PriceOverride = {
  unitPriceCop: number;
  /** Precio de la opción en el escalón de media/paca completa — la CANTIDAD sigue siendo la del producto (pack1_qty/pack2_qty). null = ese escalón no tiene precio propio para esta opción. */
  pack1PriceCop: number | null;
  pack2PriceCop: number | null;
};

export type ResolvedSelection = {
  /** Reemplaza los 3 precios del producto (unidad/media paca/paca completa) cuando hay un atributo que afecta precio; null si ninguno lo hace. */
  priceOverride: PriceOverride | null;
  /** "Color: Chrome Gold · Talla: 18 pulgadas" — para WhatsApp y el detalle de pedido en el admin. */
  summary: string;
  selections: {
    attributeId: string;
    optionId: string;
    attributeDisplayName: string;
    optionDisplayName: string;
  }[];
};

/**
 * Valida que el carrito eligió exactamente una opción por cada grupo de
 * atributos del producto, y resuelve el precio a partir del único grupo
 * marcado affects_price (ver migración 0021 / índice
 * product_attributes_one_price_driver). Nunca confía en un precio enviado
 * por el cliente: priceOverride sale de los precios de la opción, leídos de
 * la BD por el caller — cuando existe, reemplaza POR COMPLETO los precios
 * propios del producto (nunca se mezclan).
 */
export function resolveProductSelection(
  attributes: AttributeForSelection[],
  options: OptionForSelection[],
  selectedOptionIds: string[]
): { ok: true; result: ResolvedSelection } | { ok: false; error: string } {
  if (attributes.length === 0) {
    return { ok: true, result: { priceOverride: null, summary: "", selections: [] } };
  }

  const attributeIds = new Set(attributes.map((a) => a.id));
  const optionsById = new Map(options.map((o) => [o.id, o]));
  const selectedByAttribute = new Map<string, OptionForSelection>();

  for (const optionId of selectedOptionIds) {
    const option = optionsById.get(optionId);
    if (!option || !attributeIds.has(option.attributeId)) {
      return { ok: false, error: `Opción inválida: ${optionId}` };
    }
    if (selectedByAttribute.has(option.attributeId)) {
      return { ok: false, error: "Solo se puede elegir una opción por grupo." };
    }
    selectedByAttribute.set(option.attributeId, option);
  }

  for (const attribute of attributes) {
    if (!selectedByAttribute.has(attribute.id)) {
      return { ok: false, error: `Falta seleccionar una opción de "${attribute.displayName}".` };
    }
  }

  const priceDriver = attributes.find((a) => a.affectsPrice);
  let priceOverride: PriceOverride | null = null;
  if (priceDriver) {
    const chosen = selectedByAttribute.get(priceDriver.id)!;
    if (chosen.unitPriceCop == null) {
      return { ok: false, error: `La opción "${chosen.displayName}" no tiene un precio configurado.` };
    }
    priceOverride = { unitPriceCop: chosen.unitPriceCop, pack1PriceCop: chosen.pack1PriceCop, pack2PriceCop: chosen.pack2PriceCop };
  }

  const selections = attributes.map((attribute) => {
    const option = selectedByAttribute.get(attribute.id)!;
    return {
      attributeId: attribute.id,
      optionId: option.id,
      attributeDisplayName: attribute.displayName,
      optionDisplayName: option.displayName,
    };
  });

  const summary = selections.map((s) => `${s.attributeDisplayName}: ${s.optionDisplayName}`).join(" · ");

  return { ok: true, result: { priceOverride, summary, selections } };
}
