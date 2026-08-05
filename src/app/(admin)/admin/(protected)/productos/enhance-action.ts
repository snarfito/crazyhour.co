"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/supabase/dal";
import { enhanceImage } from "@/lib/gemini/enhance";

export async function enhanceProductImage(imageId: string, prompt: string) {
  await verifySession();
  const supabase = await createClient();

  const { data: image } = await supabase
    .from("product_images")
    .select("*")
    .eq("id", imageId)
    .single();
  if (!image) throw new Error("Imagen no encontrada.");

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

  const { error: updateError } = await supabase
    .from("product_images")
    .update({ enhanced_url: publicUrl, gemini_processed_at: new Date().toISOString() })
    .eq("id", imageId);
  if (updateError) throw updateError;

  revalidatePath(`/admin/productos/${image.product_id}`);
}
