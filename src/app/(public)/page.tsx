import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/catalog/hero";
import { CategoryGrid } from "@/components/catalog/category-grid";
import { HowItWorks } from "@/components/catalog/how-it-works";
import { FeaturedCategoryStrip } from "@/components/catalog/featured-category-strip";
import { EmptyState } from "@/components/catalog/empty-state";
import { EventAnimation } from "@/components/event-animation/event-animation";
import { getEffectiveEventTheme } from "@/components/event-animation/effective-theme";
import { getThemeMotionSettings, DEFAULT_MOTION_SETTINGS } from "@/lib/theme-settings";
import { getWhatsAppNumber } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp-message";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: activeProductLinks }, theme, whatsappNumber] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, cover_image_url, description, is_featured")
      .order("sort_order"),
    supabase
      .from("product_categories")
      .select("category_id, products!inner(is_active)")
      .eq("products.is_active", true),
    getEffectiveEventTheme(),
    getWhatsAppNumber(),
  ]);
  const settings = theme === "none" ? DEFAULT_MOTION_SETTINGS : await getThemeMotionSettings(theme);
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, "Hola, quiero hacer un pedido.");

  const counts = (activeProductLinks ?? []).reduce<Record<string, number>>((acc, link) => {
    acc[link.category_id] = (acc[link.category_id] ?? 0) + 1;
    return acc;
  }, {});

  if (!categories || categories.length === 0) {
    return (
      <>
        <EventAnimation theme={theme} settings={settings} />
        <Hero whatsappUrl={whatsappUrl} />
        <EmptyState message="Estamos armando el catálogo — vuelve pronto." />
        <HowItWorks />
      </>
    );
  }

  const featured = categories.find((c) => c.is_featured) ?? null;

  return (
    <>
      <EventAnimation theme={theme} settings={settings} />
      <Hero whatsappUrl={whatsappUrl} />
      {featured && (
        <FeaturedCategoryStrip
          name={featured.name}
          slug={featured.slug}
          description={featured.description}
          coverImageUrl={featured.cover_image_url}
        />
      )}
      <div id="catalogo" className="p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-glow font-heading text-xl font-black sm:text-2xl">Categorías</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {categories.length} {categories.length === 1 ? "temática" : "temáticas"}
          </span>
        </div>
        <CategoryGrid
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            cover_image_url: c.cover_image_url,
            productCount: counts[c.id] ?? 0,
          }))}
        />
      </div>
      <HowItWorks />
    </>
  );
}
