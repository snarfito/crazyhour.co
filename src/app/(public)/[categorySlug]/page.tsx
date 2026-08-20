import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWhatsAppNumber } from "@/lib/settings";
import { CategoryProductsFilter } from "@/components/catalog/category-products-filter";
import { isRecentlyCreated } from "@/lib/product-freshness";
import { CategoryWhatsAppCta } from "@/components/catalog/category-whatsapp-cta";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { BrandPlaceholder } from "@/components/catalog/brand-placeholder";
import { EmptyState } from "@/components/catalog/empty-state";
import { EventAnimation } from "@/components/event-animation/event-animation";
import { getEffectiveEventTheme } from "@/components/event-animation/effective-theme";
import { getThemeMotionSettings, DEFAULT_MOTION_SETTINGS } from "@/lib/theme-settings";
import { isValidEventTheme } from "@/lib/event-themes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", categorySlug)
    .maybeSingle();
  return { title: data ? `${data.name} — Crazy Hour` : "Crazy Hour" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, description, cover_image_url, animation_theme")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!category) notFound();

  const categoryTheme = isValidEventTheme(category.animation_theme) ? category.animation_theme : null;
  const [theme, whatsappNumber] = await Promise.all([
    getEffectiveEventTheme(categoryTheme),
    getWhatsAppNumber(),
  ]);
  const settings = theme === "none" ? DEFAULT_MOTION_SETTINGS : await getThemeMotionSettings(theme);

  // Products belonging to this category via product_categories (Task 1) —
  // filtering on the embedded join restricts to a single category_id, so
  // each matching product returns exactly one row (its PK prevents a
  // duplicate (product_id, category_id) pair).
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, unit_price_cop, created_at, product_images(original_url, enhanced_url), product_categories!inner(category_id)"
    )
    .eq("product_categories.category_id", category.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const items = (products ?? []).map((p) => {
    const images = (p.product_images ?? []) as { original_url: string; enhanced_url: string | null }[];
    const first = images.find((img) => img.enhanced_url || img.original_url);
    const imageUrl = first ? first.enhanced_url || first.original_url : null;
    const isNew = isRecentlyCreated(p.created_at);
    return { id: p.id, name: p.name, price_cop: p.unit_price_cop, imageUrl, isNew };
  });

  return (
    <>
      <EventAnimation theme={theme} settings={settings} />
      <div className="p-4">
        <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: category.name }]} />

        <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
          <div>
            <h1 className="font-heading text-2xl font-extrabold sm:text-3xl">{category.name}</h1>
            {category.description && (
              <p className="mt-2 text-muted-foreground">{category.description}</p>
            )}
          </div>
          <div className="relative aspect-video max-h-64 overflow-hidden rounded-2xl sm:max-h-72">
            {category.cover_image_url ? (
              <Image
                src={category.cover_image_url}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-contain"
              />
            ) : (
              <BrandPlaceholder seed={category.id} />
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-4">
            <EmptyState message="No hay productos en esta categoría todavía." />
          </div>
        ) : (
          <div className="mt-6">
            <CategoryProductsFilter products={items} />
          </div>
        )}

        <CategoryWhatsAppCta whatsappNumber={whatsappNumber} />
      </div>
    </>
  );
}
