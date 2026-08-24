"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/supabase/dal";
import { enhanceImage } from "@/lib/gemini/enhance";

// original_url is only ever set from getPublicUrl() on this bucket (see
// image-upload.tsx) — enforcing that prefix before fetching it server-side
// stops an admin from pointing this at an arbitrary host (SSRF) by writing
// a crafted URL into product_images.original_url.
const CATALOG_IMAGE_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalog-images/`;

export async function enhanceProductImage(imageId: string, prompt: string) {
  await requirePermission("productos");
  const supabase = await createClient();

  const { data: image } = await supabase
    .from("product_images")
    .select("*")
    .eq("id", imageId)
    .single();
  if (!image) throw new Error("Imagen no encontrada.");
  if (!image.original_url.startsWith(CATALOG_IMAGE_URL_PREFIX)) {
    throw new Error("URL de imagen no válida.");
  }

  const originalResponse = await fetch(image.original_url);
  const originalBytes = Buffer.from(await originalResponse.arrayBuffer());
  const mimeType = originalResponse.headers.get("content-type") ?? "image/jpeg";

  const { imageBytes, mimeType: enhancedMimeType } = await enhanceImage({
    imageBytes: originalBytes,
    mimeType,
    prompt,
  });

  const ext = enhancedMimeType.split("/")[1] ?? "png";
  const path = `products/${image.product_id}/${imageId}-enhanced.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("catalog-images")
    .upload(path, imageBytes, { contentType: enhancedMimeType, upsert: true });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("catalog-images").getPublicUrl(path);

  // Storage path is deterministic (products/{productId}/{imageId}-enhanced.*)
  // so regenerating overwrites the same object at the same URL. Without a
  // cache-busting query param, browsers keep showing the previous image.
  const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("product_images")
    .update({ enhanced_url: cacheBustedUrl, gemini_processed_at: new Date().toISOString() })
    .eq("id", imageId);
  if (updateError) throw updateError;

  revalidatePath(`/admin/productos/${image.product_id}`);
}
