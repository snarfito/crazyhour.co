"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/supabase/dal";

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  const str = String(value ?? "").trim();
  return str ? Number(str) : null;
}

export async function createProduct(formData: FormData) {
  await requirePermission("productos");
  const supabase = await createClient();

  const categoryIds = formData.getAll("category_ids").map(String);

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      unit_price_cop: Number(formData.get("unit_price_cop") ?? 0),
      pack1_qty: parseOptionalInt(formData.get("pack1_qty")),
      pack1_price_cop: parseOptionalInt(formData.get("pack1_price_cop")),
      pack2_qty: parseOptionalInt(formData.get("pack2_qty")),
      pack2_price_cop: parseOptionalInt(formData.get("pack2_price_cop")),
      sku: String(formData.get("sku") ?? "").trim(),
      is_active: true,
    })
    .select("id")
    .single();
  if (error || !product) throw error ?? new Error("No se pudo crear el producto.");

  if (categoryIds.length > 0) {
    const { error: linkError } = await supabase
      .from("product_categories")
      .insert(categoryIds.map((categoryId) => ({ product_id: product.id, category_id: categoryId })));
    if (linkError) throw linkError;
  }

  revalidatePath("/admin/productos");
}

export async function updateProduct(id: string, formData: FormData) {
  await requirePermission("productos");
  const supabase = await createClient();

  const categoryIds = formData.getAll("category_ids").map(String);

  const { error } = await supabase
    .from("products")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      unit_price_cop: Number(formData.get("unit_price_cop") ?? 0),
      pack1_qty: parseOptionalInt(formData.get("pack1_qty")),
      pack1_price_cop: parseOptionalInt(formData.get("pack1_price_cop")),
      pack2_qty: parseOptionalInt(formData.get("pack2_qty")),
      pack2_price_cop: parseOptionalInt(formData.get("pack2_price_cop")),
      sku: String(formData.get("sku") ?? "").trim(),
    })
    .eq("id", id);
  if (error) throw error;

  // Replace-all is simpler and correct here: the form always posts the
  // full desired set of category_ids, there's no partial-update UI.
  const { error: deleteError } = await supabase.from("product_categories").delete().eq("product_id", id);
  if (deleteError) throw deleteError;

  if (categoryIds.length > 0) {
    const { error: linkError } = await supabase
      .from("product_categories")
      .insert(categoryIds.map((categoryId) => ({ product_id: id, category_id: categoryId })));
    if (linkError) throw linkError;
  }

  revalidatePath("/admin/productos");
}

export async function toggleProductActive(id: string, isActive: boolean) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/productos");
}

export async function deleteProduct(id: string) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/productos");
}

export async function createProductImagePlaceholder(productId: string): Promise<{ id: string }> {
  await requirePermission("productos");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, original_url: "" })
    .select()
    .single();
  if (error || !data) throw error ?? new Error("No se pudo registrar la imagen.");

  return { id: data.id };
}

export async function setProductImageUrl(imageId: string, url: string) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { error } = await supabase
    .from("product_images")
    .update({ original_url: url })
    .eq("id", imageId);
  if (error) throw error;

  revalidatePath("/admin/productos");
}

export async function deleteProductImage(imageId: string) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;

  revalidatePath("/admin/productos");
}
