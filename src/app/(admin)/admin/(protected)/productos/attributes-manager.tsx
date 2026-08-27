"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/admin/submit-button";
import { DeleteForm } from "@/components/admin/delete-form";
import { SELECT_CLASSES } from "@/lib/admin-ui";
import { formatCOP } from "@/lib/format";
import { suggestColorHex } from "@/lib/color-name-to-hex";
import { ImagePicker, type ProductImageOption } from "./image-picker";
import { BulkPhotoUpload } from "./bulk-photo-upload";
import {
  createAttribute,
  updateAttribute,
  deleteAttribute,
  createOption,
  createOptionsBatch,
  updateOption,
  toggleOptionActive,
  deleteOption,
} from "./attributes-actions";

const KIND_LABEL: Record<string, string> = { color: "Color", size: "Tamaño", generic: "Genérico" };
const DEFAULT_COLOR_HEX = "#cccccc";

type OptionData = {
  id: string;
  display_name: string;
  color_hex: string | null;
  unit_price_cop: number | null;
  pack1_price_cop: number | null;
  pack2_price_cop: number | null;
  is_active: boolean;
  product_image_id: string | null;
};

type AttributeData = {
  id: string;
  kind: string;
  display_name: string;
  affects_price: boolean;
  has_photos: boolean;
  attribute_options: OptionData[];
};

export function AttributesManager({
  productId,
  attributes,
  images,
  productPack1Qty,
  productPack2Qty,
}: {
  productId: string;
  attributes: AttributeData[];
  images: ProductImageOption[];
  /** Cantidad de "paca completa"/"media paca" — vive en el producto y es la misma para todas sus opciones; solo el precio en cada escalón varía por opción. */
  productPack1Qty: number | null;
  productPack2Qty: number | null;
}) {
  const hasPriceDriver = attributes.some((a) => a.affects_price);
  const hasPhotoGroup = attributes.some((a) => a.has_photos);
  // Solo el grupo marcado has_photos participa del emparejado por nombre —
  // subir "18-pulgadas.jpg" no debería poder pisar la foto de un color.
  const photoOptions = attributes
    .filter((a) => a.has_photos)
    .flatMap((a) => a.attribute_options.map((o) => ({ id: o.id, displayName: o.display_name })));

  return (
    <div className="flex flex-col gap-4">
      <BulkPhotoUpload productId={productId} options={photoOptions} />
      {attributes.map((attribute) => (
        <AttributeCard
          key={attribute.id}
          productId={productId}
          attribute={attribute}
          images={images}
          priceCheckboxDisabled={hasPriceDriver && !attribute.affects_price}
          photoCheckboxDisabled={hasPhotoGroup && !attribute.has_photos}
          productPack1Qty={productPack1Qty}
          productPack2Qty={productPack2Qty}
        />
      ))}
      <NewAttributeForm productId={productId} priceCheckboxDisabled={hasPriceDriver} photoCheckboxDisabled={hasPhotoGroup} />
    </div>
  );
}

function NewAttributeForm({
  productId,
  priceCheckboxDisabled,
  photoCheckboxDisabled,
}: {
  productId: string;
  priceCheckboxDisabled: boolean;
  photoCheckboxDisabled: boolean;
}) {
  const createWithId = createAttribute.bind(null, productId);
  return (
    <form action={createWithId} className="rounded-lg border border-dashed border-border p-3">
      <p className="mb-2 text-sm font-medium text-foreground">Agregar grupo de variantes</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="new-attr-display-name">Nombre (ej. Talla, Color, Material)</Label>
          <Input id="new-attr-display-name" name="display_name" required />
        </div>
        <div>
          <Label htmlFor="new-attr-kind">Tipo</Label>
          <select id="new-attr-kind" name="kind" defaultValue="generic" className={SELECT_CLASSES}>
            <option value="color">Color</option>
            <option value="size">Tamaño</option>
            <option value="generic">Genérico</option>
          </select>
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            id="new-attr-affects-price"
            name="affects_price"
            type="checkbox"
            disabled={priceCheckboxDisabled}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <Label htmlFor="new-attr-affects-price" className={priceCheckboxDisabled ? "text-muted-foreground" : ""}>
            Este grupo define el precio {priceCheckboxDisabled && "(ya hay otro grupo que lo define)"}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="new-attr-has-photos"
            name="has_photos"
            type="checkbox"
            disabled={photoCheckboxDisabled}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <Label htmlFor="new-attr-has-photos" className={photoCheckboxDisabled ? "text-muted-foreground" : ""}>
            Este grupo tiene fotos {photoCheckboxDisabled && "(ya hay otro grupo con fotos)"}
          </Label>
        </div>
      </div>
      <SubmitButton className="mt-3" size="sm">
        Agregar grupo
      </SubmitButton>
    </form>
  );
}

function AttributeCard({
  productId,
  attribute,
  images,
  priceCheckboxDisabled,
  photoCheckboxDisabled,
  productPack1Qty,
  productPack2Qty,
}: {
  productId: string;
  attribute: AttributeData;
  images: ProductImageOption[];
  priceCheckboxDisabled: boolean;
  photoCheckboxDisabled: boolean;
  productPack1Qty: number | null;
  productPack2Qty: number | null;
}) {
  const [batchOpen, setBatchOpen] = useState(false);
  const updateWithId = updateAttribute.bind(null, attribute.id, productId);
  const deleteWithId = deleteAttribute.bind(null, attribute.id, productId);
  const batchAction = createOptionsBatch.bind(null, attribute.id, productId);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <form action={updateWithId} className="flex flex-1 flex-wrap items-center gap-2">
          <Input name="display_name" defaultValue={attribute.display_name} className="max-w-48" required />
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {KIND_LABEL[attribute.kind] ?? attribute.kind}
          </span>
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <input
              name="affects_price"
              type="checkbox"
              defaultChecked={attribute.affects_price}
              disabled={priceCheckboxDisabled}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Afecta el precio
          </label>
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <input
              name="has_photos"
              type="checkbox"
              defaultChecked={attribute.has_photos}
              disabled={photoCheckboxDisabled}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Tiene fotos
          </label>
          <SubmitButton variant="outline" size="sm">
            Guardar
          </SubmitButton>
        </form>
        <DeleteForm
          action={deleteWithId}
          confirmMessage={`¿Eliminar el grupo "${attribute.display_name}" y todas sus opciones? Esta acción no se puede deshacer.`}
        >
          Eliminar grupo
        </DeleteForm>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {attribute.attribute_options.map((option) => (
          <OptionRow
            key={option.id}
            productId={productId}
            option={option}
            images={images}
            kind={attribute.kind}
            affectsPrice={attribute.affects_price}
            hasPhotos={attribute.has_photos}
            productPack1Qty={productPack1Qty}
            productPack2Qty={productPack2Qty}
          />
        ))}
        {attribute.attribute_options.length === 0 && (
          <li className="text-sm text-muted-foreground">Sin opciones todavía.</li>
        )}
      </ul>

      <AddOptionForm
        attribute={attribute}
        productId={productId}
        images={images}
        productPack1Qty={productPack1Qty}
        productPack2Qty={productPack2Qty}
      />

      {attribute.kind === "color" && (
        <div className="mt-2 border-t border-border pt-2">
          <button
            type="button"
            onClick={() => setBatchOpen((v) => !v)}
            className="text-xs text-muted-foreground hover:underline"
          >
            {batchOpen ? "Ocultar" : "Agregar varios colores a la vez"}
          </button>
          {batchOpen && (
            <form action={batchAction} className="mt-2">
              <Textarea
                name="namesRaw"
                placeholder={"Un color por línea, ej.:\nChrome Gold\nChrome Silver\nChrome Red"}
                rows={4}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                El color de cada uno se sugiere solo a partir del nombre — se puede corregir después.
              </p>
              <SubmitButton variant="outline" size="sm" className="mt-2">
                Agregar todos
              </SubmitButton>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

/** Los 3 precios de una opción (unidad/media paca/paca completa) — la cantidad de cada escalón es la del producto, solo se muestra como referencia. */
function PriceFields({
  defaults,
  productPack1Qty,
  productPack2Qty,
  required,
}: {
  defaults?: { unitPriceCop: number | null; pack1PriceCop: number | null; pack2PriceCop: number | null };
  productPack1Qty: number | null;
  productPack2Qty: number | null;
  required?: boolean;
}) {
  return (
    <>
      <Input
        name="unit_price_cop"
        type="number"
        min={0}
        placeholder="Precio por unidad"
        defaultValue={defaults?.unitPriceCop ?? ""}
        required={required}
      />
      {productPack2Qty != null && (
        <Input
          name="pack2_price_cop"
          type="number"
          min={0}
          placeholder={`Precio media paca (${productPack2Qty} un.)`}
          defaultValue={defaults?.pack2PriceCop ?? ""}
        />
      )}
      {productPack1Qty != null && (
        <Input
          name="pack1_price_cop"
          type="number"
          min={0}
          placeholder={`Precio paca completa (${productPack1Qty} un.)`}
          defaultValue={defaults?.pack1PriceCop ?? ""}
        />
      )}
    </>
  );
}

/** Formulario para agregar una opción — controlado para poder sugerir el color a partir del nombre y usar el picker visual de fotos. */
function AddOptionForm({
  attribute,
  productId,
  images,
  productPack1Qty,
  productPack2Qty,
}: {
  attribute: AttributeData;
  productId: string;
  images: ProductImageOption[];
  productPack1Qty: number | null;
  productPack2Qty: number | null;
}) {
  const createOptionWithId = createOption.bind(null, attribute.id, productId);
  const [displayName, setDisplayName] = useState("");
  const [colorHex, setColorHex] = useState(DEFAULT_COLOR_HEX);
  const [colorTouched, setColorTouched] = useState(false);
  const [productImageId, setProductImageId] = useState("");

  function handleNameChange(value: string) {
    setDisplayName(value);
    if (attribute.kind === "color" && !colorTouched) {
      setColorHex(suggestColorHex(value) ?? DEFAULT_COLOR_HEX);
    }
  }

  return (
    <form action={createOptionWithId} className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
      <Input
        name="display_name"
        placeholder="Nombre de la opción"
        value={displayName}
        onChange={(e) => handleNameChange(e.target.value)}
        required
      />
      {attribute.kind === "color" && (
        <Input
          name="color_hex"
          type="color"
          value={colorHex}
          onChange={(e) => {
            setColorHex(e.target.value);
            setColorTouched(true);
          }}
        />
      )}
      {attribute.affects_price && (
        <PriceFields productPack1Qty={productPack1Qty} productPack2Qty={productPack2Qty} required />
      )}
      <input type="hidden" name="product_image_id" value={attribute.has_photos ? productImageId : ""} />
      {attribute.has_photos && <ImagePicker images={images} value={productImageId} onChange={setProductImageId} />}
      <SubmitButton variant="outline" size="sm" className="col-span-2 self-start">
        Agregar opción
      </SubmitButton>
    </form>
  );
}

function OptionRow({
  productId,
  option,
  images,
  kind,
  affectsPrice,
  hasPhotos,
  productPack1Qty,
  productPack2Qty,
}: {
  productId: string;
  option: OptionData;
  images: ProductImageOption[];
  kind: string;
  affectsPrice: boolean;
  hasPhotos: boolean;
  productPack1Qty: number | null;
  productPack2Qty: number | null;
}) {
  const updateWithId = updateOption.bind(null, option.id, productId);
  const toggleWithId = toggleOptionActive.bind(null, option.id, productId, !option.is_active);
  const deleteWithId = deleteOption.bind(null, option.id, productId);
  const [productImageId, setProductImageId] = useState(option.product_image_id ?? "");

  return (
    <li className="flex flex-wrap items-center gap-2 rounded border border-border p-2">
      {kind === "color" && option.color_hex && (
        <span className="h-5 w-5 shrink-0 rounded-full border border-border" style={{ backgroundColor: option.color_hex }} />
      )}
      <form action={updateWithId} className="flex flex-1 flex-wrap items-center gap-2">
        <Input name="display_name" defaultValue={option.display_name} className="max-w-40" required />
        {kind === "color" && <Input name="color_hex" type="color" defaultValue={option.color_hex ?? DEFAULT_COLOR_HEX} />}
        {affectsPrice && (
          <PriceFields
            defaults={{ unitPriceCop: option.unit_price_cop, pack1PriceCop: option.pack1_price_cop, pack2PriceCop: option.pack2_price_cop }}
            productPack1Qty={productPack1Qty}
            productPack2Qty={productPack2Qty}
            required
          />
        )}
        <input type="hidden" name="product_image_id" value={hasPhotos ? productImageId : ""} />
        {hasPhotos && <ImagePicker images={images} value={productImageId} onChange={setProductImageId} />}
        <SubmitButton variant="outline" size="sm">
          Guardar
        </SubmitButton>
      </form>
      <form action={toggleWithId}>
        <SubmitButton variant="ghost" size="sm">
          {option.is_active ? "Desactivar" : "Activar"}
        </SubmitButton>
      </form>
      <DeleteForm action={deleteWithId} confirmMessage={`¿Eliminar la opción "${option.display_name}"?`}>
        Eliminar
      </DeleteForm>
      {option.unit_price_cop != null && <span className="text-xs text-muted-foreground">{formatCOP(option.unit_price_cop)}</span>}
    </li>
  );
}
