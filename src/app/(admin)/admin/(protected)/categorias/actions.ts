"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/supabase/dal";
import { slugify } from "@/lib/slug";
import { generateCoverImage } from "@/lib/gemini/enhance";

function readAnimationTheme(formData: FormData): string | null {
  const value = String(formData.get("animation_theme") ?? "");
  return value === "" ? null : value;
}

function readDescription(formData: FormData): string | null {
  const value = String(formData.get("description") ?? "").trim();
  return value === "" ? null : value;
}

function readIsFeatured(formData: FormData): boolean {
  return formData.get("is_featured") === "on";
}

// The home page only ever shows one featured category (the lowest
// sort_order among is_featured=true rows) — enforce that at write time so
// checking one doesn't silently leave a previous pick still marked featured.
async function clearOtherFeatured(supabase: Awaited<ReturnType<typeof createClient>>, exceptId: string) {
  const { error } = await supabase
    .from("categories")
    .update({ is_featured: false })
    .eq("is_featured", true)
    .neq("id", exceptId);
  if (error) throw error;
}

export async function createCategory(formData: FormData) {
  await verifySession();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(name);
  const animationTheme = readAnimationTheme(formData);

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    throw new Error(`Ya existe una categoría con el slug "${slug}".`);
  }

  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (last?.sort_order ?? -1) + 1;

  const isFeatured = readIsFeatured(formData);
  const { data: created, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
      sort_order: sortOrder,
      animation_theme: animationTheme,
      description: readDescription(formData),
      is_featured: isFeatured,
    })
    .select("id")
    .single();
  if (error) throw error;
  if (isFeatured) await clearOtherFeatured(supabase, created.id);

  revalidatePath("/admin/categorias", "layout");
}

export async function updateCategory(id: string, formData: FormData) {
  await verifySession();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const animationTheme = readAnimationTheme(formData);

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();
  if (existing) {
    throw new Error(`Ya existe otra categoría con el slug "${slug}".`);
  }

  const isFeatured = readIsFeatured(formData);
  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      animation_theme: animationTheme,
      description: readDescription(formData),
      is_featured: isFeatured,
    })
    .eq("id", id);
  if (error) throw error;
  if (isFeatured) await clearOtherFeatured(supabase, id);

  revalidatePath("/admin/categorias", "layout");
}

export async function reorderCategories(orderedIds: string[]) {
  await verifySession();
  const supabase = await createClient();

  // Not .upsert(): Supabase's upsert replaces the whole row via
  // `excluded.*` for every column, not just the ones in the payload —
  // sending only {id, sort_order} nulls out name/slug on conflict. A plain
  // per-row UPDATE only ever touches the column it names.
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("categories").update({ sort_order: index }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;

  revalidatePath("/admin/categorias", "layout");
  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  await verifySession();
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/categorias", "layout");
}

export async function setCategoryCoverImage(categoryId: string, url: string) {
  await verifySession();
  const supabase = await createClient();

  // Storage path is deterministic (categories/{id}/cover.*) so re-uploading
  // or regenerating overwrites the same object at the same URL. Without a
  // cache-busting query param, browsers keep showing the previous image.
  const cacheBustedUrl = `${url}?v=${Date.now()}`;

  const { error } = await supabase
    .from("categories")
    .update({ cover_image_url: cacheBustedUrl })
    .eq("id", categoryId);
  if (error) throw error;

  revalidatePath("/admin/categorias", "layout");
}

export async function generateCategoryCoverImage(categoryId: string, prompt: string) {
  await verifySession();
  const supabase = await createClient();

  const { imageBytes, mimeType } = await generateCoverImage({ prompt });

  const ext = mimeType.split("/")[1] ?? "png";
  const path = `categories/${categoryId}/cover.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("catalog-images")
    .upload(path, imageBytes, { contentType: mimeType, upsert: true });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("catalog-images").getPublicUrl(path);

  await setCategoryCoverImage(categoryId, publicUrl);
}
