import { createClient } from "@/lib/supabase/server";
import { CategoryGrid } from "@/components/catalog/category-grid";
import { EmptyState } from "@/components/catalog/empty-state";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, cover_image_url")
    .order("sort_order");

  if (!categories || categories.length === 0) {
    return <EmptyState message="Estamos armando el catálogo — vuelve pronto." />;
  }

  return (
    <div className="p-4">
      <CategoryGrid categories={categories} />
    </div>
  );
}
