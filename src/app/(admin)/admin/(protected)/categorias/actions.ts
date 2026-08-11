"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/supabase/dal";
import { slugify } from "@/lib/slug";

function readAnimationTheme(formData: FormData): string | null {
  const value = String(formData.get("animation_theme") ?? "");
  return value === "" ? null : value;
}

export async function createCategory(formData: FormData) {
  await verifySession();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
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

  const { error } = await supabase
    .from("categories")
    .insert({ name, slug, sort_order: sortOrder, animation_theme: animationTheme });
  if (error) throw error;

  revalidatePath("/admin/categorias");
}

export async function updateCategory(id: string, formData: FormData) {
  await verifySession();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
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

  const { error } = await supabase
    .from("categories")
    .update({ name, slug, sort_order: sortOrder, animation_theme: animationTheme })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/categorias");
}

export async function deleteCategory(id: string) {
  await verifySession();
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/categorias");
}

export async function setCategoryCoverImage(categoryId: string, url: string) {
  await verifySession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({ cover_image_url: url })
    .eq("id", categoryId);
  if (error) throw error;

  revalidatePath("/admin/categorias");
}
