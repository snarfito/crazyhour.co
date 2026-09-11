import { createClient } from "@/lib/supabase/client";
import { createProductImagePlaceholder, setProductImageUrl, deleteProductImage } from "./actions";

/** Sube un archivo al bucket catalog-images y lo registra en product_images — usado por el uploader de una foto y el de fotos en lote. */
export async function uploadProductImage(productId: string, file: File): Promise<{ id: string; url: string }> {
  const supabase = createClient();
  const inserted = await createProductImagePlaceholder(productId);

  const ext = file.name.split(".").pop();
  const path = `products/${productId}/${inserted.id}-original.${ext}`;

  const { error: uploadError } = await supabase.storage.from("catalog-images").upload(path, file, { upsert: true });
  if (uploadError) {
    await deleteProductImage(inserted.id);
    throw new Error("No se pudo subir la imagen.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("catalog-images").getPublicUrl(path);

  await setProductImageUrl(inserted.id, publicUrl);

  return { id: inserted.id, url: publicUrl };
}

/** Re-uploads a cropped file for an existing image row — no new placeholder, and the stale enhanced version is cleared. */
export async function recropProductImage(productId: string, imageId: string, file: File): Promise<{ url: string }> {
  const supabase = createClient();

  const ext = file.name.split(".").pop();
  // A fresh path (not the previous one) is a deliberate cache-buster: the
  // old path's public URL stays cached by Next.js Image Optimization for
  // hours after the file underneath it changes, so overwriting in place
  // left recropped photos looking unchanged on the storefront.
  const path = `products/${productId}/${imageId}-original-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("catalog-images").upload(path, file, { upsert: true });
  if (uploadError) throw new Error("No se pudo recortar la imagen.");

  const {
    data: { publicUrl },
  } = supabase.storage.from("catalog-images").getPublicUrl(path);

  await setProductImageUrl(imageId, publicUrl, { clearEnhanced: true });

  return { url: publicUrl };
}
