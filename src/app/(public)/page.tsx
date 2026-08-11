import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/catalog/hero";
import { CategoryGrid } from "@/components/catalog/category-grid";
import { EmptyState } from "@/components/catalog/empty-state";
import { EventAnimation } from "@/components/event-animation/event-animation";
import { getEffectiveEventTheme } from "@/components/event-animation/effective-theme";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: categories }, theme] = await Promise.all([
    supabase.from("categories").select("id, name, slug, cover_image_url").order("sort_order"),
    getEffectiveEventTheme(),
  ]);

  if (!categories || categories.length === 0) {
    return (
      <>
        <EventAnimation theme={theme} />
        <Hero />
        <EmptyState message="Estamos armando el catálogo — vuelve pronto." />
      </>
    );
  }

  return (
    <>
      <EventAnimation theme={theme} />
      <Hero />
      <div id="catalogo" className="p-4">
        <CategoryGrid categories={categories} />
      </div>
    </>
  );
}
