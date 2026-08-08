import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/format";
import { ImageGallery } from "./image-gallery";
import { AddToCart } from "./add-to-cart";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  return { title: data ? `${data.name} — Crazy Hour` : "Crazy Hour" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, description, price_cop, is_active, category_id, categories(slug), product_images(original_url, enhanced_url)")
    .eq("id", id)
    .maybeSingle();

  if (!product || !product.is_active) notFound();

  const images = (product.product_images ?? [])
    .map((img: { original_url: string; enhanced_url: string | null }) => img.enhanced_url || img.original_url)
    .filter((url: string): url is string => Boolean(url))
    .map((url: string) => ({ url, alt: product.name }));

  const categorySlug = (
    product.categories as unknown as { slug: string } | null
  )?.slug;

  return (
    <div className="p-4">
      {categorySlug && (
        <Link href={`/${categorySlug}`} className="text-sm text-primary hover:underline">
          ← Volver a la categoría
        </Link>
      )}
      <div className="animate-stagger-in mt-3 grid gap-6 md:grid-cols-2">
        <ImageGallery images={images} productName={product.name} />
        <div>
          <h1 className="font-heading text-2xl font-extrabold">{product.name}</h1>
          <p className="mt-2 font-heading text-xl font-bold">{formatCOP(product.price_cop)}</p>
          {product.description && (
            <p className="mt-4 text-muted-foreground">{product.description}</p>
          )}
          <AddToCart
            productId={product.id}
            name={product.name}
            priceCop={product.price_cop}
            imageUrl={images[0]?.url ?? null}
          />
        </div>
      </div>
    </div>
  );
}
