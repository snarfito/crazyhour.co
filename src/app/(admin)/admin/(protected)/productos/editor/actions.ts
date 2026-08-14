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

const QTY_FIELDS = new Set<EditableField>(["pack1_qty", "pack2_qty"]);

const ALL_EDITABLE_FIELDS = new Set<EditableField>(["name", "description", ...NUMERIC_FIELDS]);

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

  if (!ALL_EDITABLE_FIELDS.has(field)) {
    throw new Error("Campo no editable.");
  }

  const trimmed = String(value).trim();
  if (trimmed === "" && (field === "unit_price_cop" || field === "name")) {
    throw new Error(
      field === "name" ? "El nombre no puede quedar vacío." : "El precio por unidad no puede quedar vacío.",
    );
  }

  const parsedValue: string | number | null = NUMERIC_FIELDS.has(field)
    ? trimmed === ""
      ? null
      : Number(trimmed)
    : trimmed;

  if (QTY_FIELDS.has(field) && parsedValue !== null && (parsedValue as number) < 1) {
    throw new Error("La cantidad debe ser al menos 1.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ [field]: parsedValue })
    .eq("id", productId);
  if (error) throw new Error(friendlyPostgresMessage(error));

  revalidatePath("/admin/productos/editor");
}

export async function createQuickProduct() {
  await requirePermission("productos");
  const supabase = await createClient();

  // Placeholder row the admin renames/prices inline right after creation —
  // "Producto nuevo" (not blank) so it stays reachable from the editor's
  // own name search, same reasoning as the empty-name guard above.
  const { data, error } = await supabase
    .from("products")
    .insert({ name: "Producto nuevo", unit_price_cop: 0 })
    .select("id, name, description, unit_price_cop, pack1_qty, pack1_price_cop, pack2_qty, pack2_price_cop")
    .single();
  if (error || !data) throw error ?? new Error("No se pudo crear el producto.");

  revalidatePath("/admin/productos/editor");
  return data;
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
