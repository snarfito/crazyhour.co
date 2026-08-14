import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/format";
import { isRecentlyCreated } from "@/lib/product-freshness";
import { resolveEffectiveTiers } from "@/lib/pricing";
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
      "id, name, description, unit_price_cop, pack1_qty, pack1_price_cop, pack2_qty, pack2_price_cop, is_active, product_categories(categories(id, name, slug)), product_images(original_url, enhanced_url)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!product || !product.is_active) notFound();

  const images = (product.product_images ?? [])
    .map((img: { original_url: string; enhanced_url: string | null }) => img.enhanced_url || img.original_url)
    .filter((url: string): url is string => Boolean(url))
    .map((url: string) => ({ url, alt: product.name }));

  const categoryLinks = (product.product_categories ?? []) as {
    categories: { id: string; name: string; slug: string } | null;
  }[];
  const category = categoryLinks[0]?.categories ?? null;
  const categoryIds = categoryLinks.map((l) => l.categories?.id).filter((cid): cid is string => Boolean(cid));

  const theme = await getEffectiveEventTheme();
  const settings = theme === "none" ? DEFAULT_MOTION_SETTINGS : await getThemeMotionSettings(theme);

  const tiers = resolveEffectiveTiers({
    unitPriceCop: product.unit_price_cop,
    pack1Qty: product.pack1_qty,
    pack1PriceCop: product.pack1_price_cop,
    pack2Qty: product.pack2_qty,
    pack2PriceCop: product.pack2_price_cop,
  });

  let related: { id: string; name: string; price_cop: number; imageUrl: string | null; isNew: boolean }[] = [];
  if (categoryIds.length > 0) {
    const { data: relatedRaw } = await supabase
      .from("products")
      .select(
        "id, name, unit_price_cop, created_at, product_images(original_url, enhanced_url), product_categories!inner(category_id)"
      )
      .in("product_categories.category_id", categoryIds)
      .eq("is_active", true)
      .neq("id", product.id)
      .order("created_at", { ascending: false });

    // A product sharing more than one category with the current one can
    // come back once per shared category — dedupe before slicing to 3.
    const seen = new Set<string>();
    related = (relatedRaw ?? [])
      .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
      .slice(0, 3)
      .map((p) => {
        const relatedImages = (p.product_images ?? []) as { original_url: string; enhanced_url: string | null }[];
        const first = relatedImages.find((img) => img.enhanced_url || img.original_url);
        const imageUrl = first ? first.enhanced_url || first.original_url : null;
        return {
          id: p.id,
          name: p.name,
          price_cop: p.unit_price_cop,
          imageUrl,
          isNew: isRecentlyCreated(p.created_at),
        };
      });
  }

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
            <div className="mt-2 flex flex-col gap-1">
              <p className="font-heading text-xl font-bold">{formatCOP(tiers.unitPriceCop)} c/u</p>
              {tiers.pack2 && (
                <p className="text-sm text-muted-foreground">
                  Media paca ({tiers.pack2.qty} un.): {formatCOP(tiers.pack2.unitPriceCop)} c/u
                </p>
              )}
              {tiers.pack1 && (
                <p className="text-sm text-muted-foreground">
                  Paca completa ({tiers.pack1.qty} un.): {formatCOP(tiers.pack1.unitPriceCop)} c/u
                </p>
              )}
            </div>
            {product.description && (
              <p className="mt-4 text-muted-foreground">{product.description}</p>
            )}
            <AddToCart
              productId={product.id}
              name={product.name}
              unitPriceCop={product.unit_price_cop}
              pack1Qty={product.pack1_qty}
              pack1PriceCop={product.pack1_price_cop}
              pack2Qty={product.pack2_qty}
              pack2PriceCop={product.pack2_price_cop}
              imageUrl={images[0]?.url ?? null}
            />
          </div>
        </div>
        <RelatedProducts products={related} />
      </div>
    </>
  );
}
