import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/format";
import { ImageGallery } from "./image-gallery";
import { Button } from "@/components/ui/button";

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

  const images = (product.product_images ?? []).map(
    (img: { original_url: string; enhanced_url: string | null }) => ({
      url: img.enhanced_url ?? img.original_url,
      alt: product.name,
    })
  );

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
      <div className="mt-3 grid gap-6 md:grid-cols-2">
        <ImageGallery images={images} productName={product.name} />
        <div>
          <h1 className="font-heading text-2xl font-extrabold">{product.name}</h1>
          <p className="mt-2 font-heading text-xl font-bold">{formatCOP(product.price_cop)}</p>
          {product.description && (
            <p className="mt-4 text-muted-foreground">{product.description}</p>
          )}
          <Button type="button" className="mt-6 w-full">
            Agregar al carrito
          </Button>
        </div>
      </div>
    </div>
  );
}
