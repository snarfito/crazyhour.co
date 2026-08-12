import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/catalog/hero";
import { CategoryGrid } from "@/components/catalog/category-grid";
import { HowItWorks } from "@/components/catalog/how-it-works";
import { FeaturedCategoryStrip } from "@/components/catalog/featured-category-strip";
import { EmptyState } from "@/components/catalog/empty-state";
import { EventAnimation } from "@/components/event-animation/event-animation";
import { getEffectiveEventTheme } from "@/components/event-animation/effective-theme";
import { getThemeMotionSettings, DEFAULT_MOTION_SETTINGS } from "@/lib/theme-settings";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: activeProducts }, theme] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, cover_image_url, description, is_featured")
      .order("sort_order"),
    supabase.from("products").select("category_id").eq("is_active", true),
    getEffectiveEventTheme(),
  ]);
  const settings = theme === "none" ? DEFAULT_MOTION_SETTINGS : await getThemeMotionSettings(theme);

  const counts = (activeProducts ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.category_id] = (acc[p.category_id] ?? 0) + 1;
    return acc;
  }, {});

  if (!categories || categories.length === 0) {
    return (
      <>
        <EventAnimation theme={theme} settings={settings} />
        <Hero />
        <EmptyState message="Estamos armando el catálogo — vuelve pronto." />
        <HowItWorks />
      </>
    );
  }

  const featured = categories.find((c) => c.is_featured) ?? null;

  return (
    <>
      <EventAnimation theme={theme} settings={settings} />
      <Hero />
      <div id="catalogo" className="p-4">
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
      {featured && (
        <FeaturedCategoryStrip
          name={featured.name}
          slug={featured.slug}
          description={featured.description}
          coverImageUrl={featured.cover_image_url}
        />
      )}
    </>
  );
}
