import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/catalog/product-grid";
import { EmptyState } from "@/components/catalog/empty-state";

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
    .select("id, name")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!category) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cop, product_images(original_url, enhanced_url)")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const items = (products ?? []).map((p) => {
    const images = (p.product_images ?? []) as { original_url: string; enhanced_url: string | null }[];
    const first = images.find((img) => img.enhanced_url || img.original_url);
    const imageUrl = first ? first.enhanced_url || first.original_url : null;
    return { id: p.id, name: p.name, price_cop: p.price_cop, imageUrl };
  });

  return (
    <div className="p-4">
      <h1 className="font-heading text-2xl font-extrabold">{category.name}</h1>
      {items.length === 0 ? (
        <EmptyState message="No hay productos en esta categoría todavía." />
      ) : (
        <div className="mt-4">
          <ProductGrid products={items} />
        </div>
      )}
    </div>
  );
}
