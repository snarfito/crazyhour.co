"use client";

import { useMemo, useState } from "react";
import { formatCOP } from "@/lib/format";
import { resolveEffectiveTiers } from "@/lib/pricing";
import { ImageGallery } from "./image-gallery";
import { AddToCart } from "./add-to-cart";
import { AttributeSelector } from "./attribute-selector";
import type { ProductAttributeWithOptions } from "./product-attributes-types";

export function ProductPurchasePanel({
  productId,
  name,
  description,
  images,
  unitPriceCop,
  pack1Qty,
  pack1PriceCop,
  pack2Qty,
  pack2PriceCop,
  attributes,
}: {
  productId: string;
  name: string;
  description: string | null;
  images: { url: string; alt: string }[];
  unitPriceCop: number;
  pack1Qty: number | null;
  pack1PriceCop: number | null;
  pack2Qty: number | null;
  pack2PriceCop: number | null;
  attributes: ProductAttributeWithOptions[];
}) {
  // Preselecciona la primera opción de cada grupo para que nunca se pueda
  // agregar al carrito (ni pedir por WhatsApp) sin una variante concreta
  // elegida — el cliente puede cambiarla, pero nunca arranca "sin nada".
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(attributes.filter((a) => a.options.length > 0).map((a) => [a.id, a.options[0].id]))
  );

  function handleSelect(attributeId: string, optionId: string) {
    setSelected((prev) => ({ ...prev, [attributeId]: optionId }));
  }

  const selectedOptions = useMemo(
    () =>
      attributes
        .map((attribute) => {
          const optionId = selected[attribute.id];
          const option = optionId ? attribute.options.find((o) => o.id === optionId) : undefined;
          if (!option) return null;
          return {
            attributeId: attribute.id,
            optionId: option.id,
            attributeDisplayName: attribute.displayName,
            optionDisplayName: option.displayName,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null),
    [attributes, selected]
  );

  const missingAttributes = attributes.filter((attribute) => !selected[attribute.id]);
  const allSelected = missingAttributes.length === 0;

  // La CANTIDAD de cada escalón (pack1Qty/pack2Qty) siempre es la del
  // producto. Cuando hay un grupo que afecta precio, sus 3 precios
  // reemplazan POR COMPLETO los del producto (nunca se mezclan) —
  // igual que en checkout/actions.ts.
  const priceDriver = attributes.find((a) => a.affectsPrice);
  const priceDriverOption = priceDriver
    ? priceDriver.options.find((o) => o.id === selected[priceDriver.id])
    : undefined;
  const effectiveUnitPriceCop = priceDriverOption?.unitPriceCop ?? unitPriceCop;
  const effectivePack1PriceCop = priceDriverOption ? priceDriverOption.pack1PriceCop : pack1PriceCop;
  const effectivePack2PriceCop = priceDriverOption ? priceDriverOption.pack2PriceCop : pack2PriceCop;

  const photoAttribute = attributes.find((a) => a.hasPhotos);
  const photoOption = photoAttribute ? photoAttribute.options.find((o) => o.id === selected[photoAttribute.id]) : undefined;
  const previewUrl = photoOption?.imageUrl ?? null;

  const tiers = resolveEffectiveTiers({
    unitPriceCop: effectiveUnitPriceCop,
    pack1Qty,
    pack1PriceCop: effectivePack1PriceCop,
    pack2Qty,
    pack2PriceCop: effectivePack2PriceCop,
  });

  return (
    <div className="animate-stagger-in mt-3 grid gap-6 md:grid-cols-2">
      <ImageGallery images={images} productName={name} selectedUrl={previewUrl} />
      <div>
        <h1 className="font-heading text-2xl font-extrabold">{name}</h1>
        <div className="mt-2 flex flex-col gap-1">
          <p className="font-heading text-xl font-bold">{formatCOP(tiers.unitPriceCop)} c/u</p>
          {tiers.pack2 && (
            <p className="text-sm text-muted-foreground">
              Media paca ({tiers.pack2.qty} un.): {formatCOP(tiers.pack2.unitPriceCop)} c/u
            </p>
          )}
          {tiers.pack1 && (
            <p className="text-sm text-muted-foreground">
              Paca completa ({tiers.pack1.qty} un.): {formatCOP(tiers.pack1.unitPriceCop)} c/u
            </p>
          )}
        </div>
        {description && <p className="mt-4 text-muted-foreground">{description}</p>}
        <AttributeSelector attributes={attributes} selected={selected} onSelect={handleSelect} />
        <AddToCart
          productId={productId}
          name={name}
          unitPriceCop={effectiveUnitPriceCop}
          pack1Qty={pack1Qty}
          pack1PriceCop={effectivePack1PriceCop}
          pack2Qty={pack2Qty}
          pack2PriceCop={effectivePack2PriceCop}
          imageUrl={previewUrl ?? images[0]?.url ?? null}
          selectedOptions={selectedOptions}
          disabled={!allSelected}
        />
        {!allSelected && (
          <p className="mt-2 text-xs text-destructive">
            Elige una opción de: {missingAttributes.map((a) => a.displayName).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
