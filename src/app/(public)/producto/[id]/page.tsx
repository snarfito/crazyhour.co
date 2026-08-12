import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/format";
import { isRecentlyCreated } from "@/lib/product-freshness";
import { EventAnimation } from "@/components/event-animation/event-animation";
import { getEffectiveEventTheme } from "@/components/event-animation/effective-theme";
import { getThemeMotionSettings, DEFAULT_MOTION_SETTINGS } from "@/lib/theme-settings";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { RelatedProducts } from "@/components/catalog/related-products";
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
    .select(
      "id, name, description, price_cop, is_active, category_id, categories(name, slug), product_images(original_url, enhanced_url)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!product || !product.is_active) notFound();

  const images = (product.product_images ?? [])
    .map((img: { original_url: string; enhanced_url: string | null }) => img.enhanced_url || img.original_url)
    .filter((url: string): url is string => Boolean(url))
    .map((url: string) => ({ url, alt: product.name }));

  const category = product.categories as unknown as { name: string; slug: string } | null;
  const theme = await getEffectiveEventTheme();
  const settings = theme === "none" ? DEFAULT_MOTION_SETTINGS : await getThemeMotionSettings(theme);

  const { data: relatedRaw } = await supabase
    .from("products")
    .select("id, name, price_cop, created_at, product_images(original_url, enhanced_url)")
    .eq("category_id", product.category_id)
    .eq("is_active", true)
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const related = (relatedRaw ?? []).map((p) => {
    const relatedImages = (p.product_images ?? []) as { original_url: string; enhanced_url: string | null }[];
    const first = relatedImages.find((img) => img.enhanced_url || img.original_url);
    const imageUrl = first ? first.enhanced_url || first.original_url : null;
    return {
      id: p.id,
      name: p.name,
      price_cop: p.price_cop,
      imageUrl,
      isNew: isRecentlyCreated(p.created_at),
    };
  });

  return (
    <>
      <EventAnimation theme={theme} settings={settings} />
      <div className="p-4">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            ...(category ? [{ label: category.name, href: `/${category.slug}` }] : []),
            { label: product.name },
          ]}
        />
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
        <RelatedProducts products={related} />
      </div>
    </>
  );
}
