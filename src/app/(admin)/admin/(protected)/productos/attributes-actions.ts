"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/supabase/dal";
import { suggestColorHex } from "@/lib/color-name-to-hex";

const DUPLICATE_OR_EXCLUSIVE_FLAG_ERROR =
  "Ya existe un grupo con ese nombre en este producto, o ya hay otro grupo marcado para afectar el precio o tener fotos.";

function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  const str = String(value ?? "").trim();
  return str ? Number(str) : null;
}

export async function createAttribute(productId: string, formData: FormData) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { error } = await supabase.from("product_attributes").insert({
    product_id: productId,
    kind: String(formData.get("kind") ?? "generic"),
    display_name: String(formData.get("display_name") ?? "").trim(),
    affects_price: formData.get("affects_price") === "on",
    has_photos: formData.get("has_photos") === "on",
  });
  if (error) throw isUniqueViolation(error) ? new Error(DUPLICATE_OR_EXCLUSIVE_FLAG_ERROR) : error;

  revalidatePath(`/admin/productos/${productId}`);
}

export async function updateAttribute(attributeId: string, productId: string, formData: FormData) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { error } = await supabase
    .from("product_attributes")
    .update({
      display_name: String(formData.get("display_name") ?? "").trim(),
      affects_price: formData.get("affects_price") === "on",
      has_photos: formData.get("has_photos") === "on",
    })
    .eq("id", attributeId);
  if (error) throw isUniqueViolation(error) ? new Error(DUPLICATE_OR_EXCLUSIVE_FLAG_ERROR) : error;

  revalidatePath(`/admin/productos/${productId}`);
}

export async function deleteAttribute(attributeId: string, productId: string) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { error } = await supabase.from("product_attributes").delete().eq("id", attributeId);
  if (error) throw error;

  revalidatePath(`/admin/productos/${productId}`);
}

export async function createOption(attributeId: string, productId: string, formData: FormData) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { error } = await supabase.from("attribute_options").insert({
    attribute_id: attributeId,
    display_name: String(formData.get("display_name") ?? "").trim(),
    color_hex: String(formData.get("color_hex") ?? "").trim() || null,
    unit_price_cop: parseOptionalInt(formData.get("unit_price_cop")),
    pack1_price_cop: parseOptionalInt(formData.get("pack1_price_cop")),
    pack2_price_cop: parseOptionalInt(formData.get("pack2_price_cop")),
    product_image_id: String(formData.get("product_image_id") ?? "").trim() || null,
  });
  if (error) throw error;

  revalidatePath(`/admin/productos/${productId}`);
}

/** Alta rápida: una opción por línea, sin precio ni imagen — pensado para pegar una lista de 18-30 colores de un tirón. */
export async function createOptionsBatch(attributeId: string, productId: string, formData: FormData) {
  await requirePermission("productos");
  const names = String(formData.get("namesRaw") ?? "")
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);
  if (names.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from("attribute_options").insert(
    names.map((display_name) => ({
      attribute_id: attributeId,
      display_name,
      // Sugerencia editable, no verdad definitiva — sobre todo para
      // acabados cromados/metalizados donde ningún hex plano representa
      // bien el color real (ver color-name-to-hex.ts).
      color_hex: suggestColorHex(display_name),
    }))
  );
  if (error) throw error;

  revalidatePath(`/admin/productos/${productId}`);
}

/** Vincula (o desvincula, con imageId null) la foto de una opción — usado por el picker visual y por el emparejado automático al subir varias fotos. */
export async function linkOptionImage(optionId: string, productId: string, imageId: string | null) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { error } = await supabase.from("attribute_options").update({ product_image_id: imageId }).eq("id", optionId);
  if (error) throw error;

  revalidatePath(`/admin/productos/${productId}`);
}

export async function updateOption(optionId: string, productId: string, formData: FormData) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { error } = await supabase
    .from("attribute_options")
    .update({
      display_name: String(formData.get("display_name") ?? "").trim(),
      color_hex: String(formData.get("color_hex") ?? "").trim() || null,
      unit_price_cop: parseOptionalInt(formData.get("unit_price_cop")),
      pack1_price_cop: parseOptionalInt(formData.get("pack1_price_cop")),
      pack2_price_cop: parseOptionalInt(formData.get("pack2_price_cop")),
      product_image_id: String(formData.get("product_image_id") ?? "").trim() || null,
    })
    .eq("id", optionId);
  if (error) throw error;

  revalidatePath(`/admin/productos/${productId}`);
}

export async function toggleOptionActive(optionId: string, productId: string, isActive: boolean) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { error } = await supabase.from("attribute_options").update({ is_active: isActive }).eq("id", optionId);
  if (error) throw error;

  revalidatePath(`/admin/productos/${productId}`);
}

export async function deleteOption(optionId: string, productId: string) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { error } = await supabase.from("attribute_options").delete().eq("id", optionId);
  if (error) throw error;

  revalidatePath(`/admin/productos/${productId}`);
}
