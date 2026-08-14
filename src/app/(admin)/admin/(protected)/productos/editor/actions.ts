"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/supabase/dal";

export type EditableField =
  | "name"
  | "description"
  | "unit_price_cop"
  | "pack1_qty"
  | "pack1_price_cop"
  | "pack2_qty"
  | "pack2_price_cop";

const NUMERIC_FIELDS = new Set<EditableField>([
  "unit_price_cop",
  "pack1_qty",
  "pack1_price_cop",
  "pack2_qty",
  "pack2_price_cop",
]);

// Postgres check-constraint names from migration 0013 mapped to short
// Spanish messages a non-technical admin can act on — the raw constraint
// name/error is never shown in the UI (spec section 5).
const CONSTRAINT_MESSAGES: Record<string, string> = {
  products_pack1_price_requires_qty: "La paca completa necesita una cantidad antes de tener precio.",
  products_pack2_price_requires_qty: "La media paca necesita una cantidad antes de tener precio.",
  products_pack1_qty_gt_pack2_qty: "La cantidad de paca completa debe ser mayor que la de media paca.",
  products_pack1_price_cop_check: "El precio de paca completa no puede ser negativo.",
  products_pack2_price_cop_check: "El precio de media paca no puede ser negativo.",
  products_unit_price_cop_check: "El precio por unidad no puede ser negativo.",
};

function friendlyPostgresMessage(error: { code?: string; message: string }): string {
  if (error.code === "23514") {
    const constraintName = Object.keys(CONSTRAINT_MESSAGES).find((name) => error.message.includes(name));
    if (constraintName) return CONSTRAINT_MESSAGES[constraintName];
  }
  return "No se pudo guardar el cambio.";
}

export async function updateProductField(productId: string, field: EditableField, value: string | number) {
  await requirePermission("productos");

  const trimmed = String(value).trim();
  if (field === "unit_price_cop" && trimmed === "") {
    throw new Error("El precio por unidad no puede quedar vacío.");
  }

  const parsedValue: string | number | null = NUMERIC_FIELDS.has(field)
    ? trimmed === ""
      ? null
      : Number(trimmed)
    : trimmed;

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ [field]: parsedValue })
    .eq("id", productId);
  if (error) throw new Error(friendlyPostgresMessage(error));

  revalidatePath("/admin/productos/editor");
}

export async function updateProductCategories(productId: string, categoryIds: string[]) {
  await requirePermission("productos");
  const supabase = await createClient();

  // Replace-all, same as the existing form-based updateProduct in
  // ../actions.ts: at most 14 categories per product, not worth a
  // row-by-row diff.
  const { error: deleteError } = await supabase.from("product_categories").delete().eq("product_id", productId);
  if (deleteError) throw new Error("No se pudo guardar el cambio.");

  if (categoryIds.length > 0) {
    const { error: insertError } = await supabase
      .from("product_categories")
      .insert(categoryIds.map((categoryId) => ({ product_id: productId, category_id: categoryId })));
    if (insertError) throw new Error("No se pudo guardar el cambio.");
  }

  revalidatePath("/admin/productos/editor");
}
