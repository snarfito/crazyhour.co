"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EnhanceButton } from "./enhance-button";
import { createProductImagePlaceholder, setProductImageUrl, deleteProductImage } from "./actions";

type ProductImage = { id: string; original_url: string; enhanced_url: string | null };

export function ImageUpload({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const supabase = createClient();
    let inserted: { id: string };
    try {
      inserted = await createProductImagePlaceholder(productId);
    } catch {
      setUploading(false);
      setError("No se pudo registrar la imagen. Intenta de nuevo.");
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `products/${productId}/${inserted.id}-original.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("catalog-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      await deleteProductImage(inserted.id);
      setUploading(false);
      setError("No se pudo subir la imagen. Intenta de nuevo.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("catalog-images").getPublicUrl(path);

    await setProductImageUrl(inserted.id, publicUrl);

    setUploading(false);
    router.refresh();
  }

  return (
    <div className="mt-2">
      <div className="flex flex-col gap-4">
        {images.map((img) => (
          <div key={img.id} className="rounded-md border border-border p-3">
            <div className={img.enhanced_url ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Original</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.original_url}
                  alt="Foto original"
                  className="h-64 w-full rounded border border-border bg-white object-contain"
                />
              </div>
              {img.enhanced_url && (
                <div>
                  <p className="mb-1 text-xs font-medium text-brand-green">Mejorada</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.enhanced_url}
                    alt="Foto mejorada"
                    className="h-64 w-full rounded border border-border bg-white object-contain"
                  />
                </div>
              )}
            </div>
            <div className="mt-2">
              <EnhanceButton imageId={img.id} />
            </div>
          </div>
        ))}
      </div>
      <label htmlFor="product-image-input" className="mt-3 inline-block cursor-pointer text-sm text-primary hover:underline">
        {uploading ? "Subiendo..." : "Subir foto"}
      </label>
      <input
        id="product-image-input"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleUpload}
        disabled={uploading}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
