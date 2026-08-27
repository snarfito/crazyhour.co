export type AttributeOptionData = {
  id: string;
  displayName: string;
  colorHex: string | null;
  /** Los 3 precios de esta opción (unidad/media paca/paca completa) — la CANTIDAD de cada escalón sigue siendo la del producto. */
  unitPriceCop: number | null;
  pack1PriceCop: number | null;
  pack2PriceCop: number | null;
  imageUrl: string | null;
};

export type ProductAttributeWithOptions = {
  id: string;
  kind: "color" | "size" | "generic";
  displayName: string;
  affectsPrice: boolean;
  /** Único grupo por producto cuyas opciones pueden traer foto propia y cambiar la imagen mostrada — no asumido por kind. */
  hasPhotos: boolean;
  options: AttributeOptionData[];
};
