"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/supabase/dal";

export async function createProduct(formData: FormData) {
  await verifySession();
  const supabase = await createClient();

  const { error } = await supabase.from("products").insert({
    category_id: String(formData.get("category_id")),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price_cop: Number(formData.get("price_cop") ?? 0),
    sku: String(formData.get("sku") ?? "").trim(),
    is_active: true,
  });
  if (error) throw error;

  revalidatePath("/admin/productos");
}

export async function updateProduct(id: string, formData: FormData) {
  await verifySession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      category_id: String(formData.get("category_id")),
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      price_cop: Number(formData.get("price_cop") ?? 0),
      sku: String(formData.get("sku") ?? "").trim(),
    })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/productos");
}

export async function toggleProductActive(id: string, isActive: boolean) {
  await verifySession();
  const supabase = await createClient();

  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/productos");
}

export async function deleteProduct(id: string) {
  await verifySession();
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/productos");
}

export async function createProductImagePlaceholder(productId: string): Promise<{ id: string }> {
  await verifySession();
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
  await verifySession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("product_images")
    .update({ original_url: url })
    .eq("id", imageId);
  if (error) throw error;

  revalidatePath("/admin/productos");
}

export async function deleteProductImage(imageId: string) {
  await verifySession();
  const supabase = await createClient();

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;

  revalidatePath("/admin/productos");
}
