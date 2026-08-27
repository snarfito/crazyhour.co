import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isRecentlyCreated } from "@/lib/product-freshness";
import { EventAnimation } from "@/components/event-animation/event-animation";
import { getEffectiveEventTheme } from "@/components/event-animation/effective-theme";
import { getThemeMotionSettings, DEFAULT_MOTION_SETTINGS } from "@/lib/theme-settings";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { RelatedProducts } from "@/components/catalog/related-products";
import { ProductPurchasePanel } from "./product-purchase-panel";
import type { ProductAttributeWithOptions } from "./product-attributes-types";

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
      "id, name, description, unit_price_cop, pack1_qty, pack1_price_cop, pack2_qty, pack2_price_cop, is_active, product_categories(categories(id, name, slug)), product_images(id, original_url, enhanced_url), product_attributes(id, kind, display_name, affects_price, has_photos, sort_order, attribute_options(id, display_name, color_hex, unit_price_cop, pack1_price_cop, pack2_price_cop, is_active, sort_order, product_image_id))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!product || !product.is_active) notFound();

  const productImageRows = (product.product_images ?? []) as {
    id: string;
    original_url: string;
    enhanced_url: string | null;
  }[];
  const imageUrlById = new Map(productImageRows.map((img) => [img.id, img.enhanced_url || img.original_url]));
  const images = productImageRows
    .map((img) => img.enhanced_url || img.original_url)
    .filter((url): url is string => Boolean(url))
    .map((url) => ({ url, alt: product.name }));

  const categoryLinks = (product.product_categories ?? []) as unknown as {
    categories: { id: string; name: string; slug: string } | null;
  }[];
  const category = categoryLinks[0]?.categories ?? null;
  const categoryIds = categoryLinks.map((l) => l.categories?.id).filter((cid): cid is string => Boolean(cid));

  const theme = await getEffectiveEventTheme();
  const settings = theme === "none" ? DEFAULT_MOTION_SETTINGS : await getThemeMotionSettings(theme);

  const attributeRows = (product.product_attributes ?? []) as {
    id: string;
    kind: "color" | "size" | "generic";
    display_name: string;
    affects_price: boolean;
    has_photos: boolean;
    sort_order: number;
    attribute_options: {
      id: string;
      display_name: string;
      color_hex: string | null;
      unit_price_cop: number | null;
      pack1_price_cop: number | null;
      pack2_price_cop: number | null;
      is_active: boolean;
      sort_order: number;
      product_image_id: string | null;
    }[];
  }[];
  const attributes: ProductAttributeWithOptions[] = attributeRows
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((attribute) => ({
      id: attribute.id,
      kind: attribute.kind,
      displayName: attribute.display_name,
      affectsPrice: attribute.affects_price,
      hasPhotos: attribute.has_photos,
      options: (attribute.attribute_options ?? [])
        .filter((option) => option.is_active)
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => ({
          id: option.id,
          displayName: option.display_name,
          colorHex: option.color_hex,
          unitPriceCop: option.unit_price_cop,
          pack1PriceCop: option.pack1_price_cop,
          pack2PriceCop: option.pack2_price_cop,
          imageUrl: option.product_image_id ? (imageUrlById.get(option.product_image_id) ?? null) : null,
        })),
    }));

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
        <ProductPurchasePanel
          productId={product.id}
          name={product.name}
          description={product.description}
          images={images}
          unitPriceCop={product.unit_price_cop}
          pack1Qty={product.pack1_qty}
          pack1PriceCop={product.pack1_price_cop}
          pack2Qty={product.pack2_qty}
          pack2PriceCop={product.pack2_price_cop}
          attributes={attributes}
        />
        <RelatedProducts products={related} />
      </div>
    </>
  );
}
