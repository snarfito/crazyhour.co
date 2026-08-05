"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CoverUpload({
  categoryId,
  currentUrl,
}: {
  categoryId: string;
  currentUrl: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `categories/${categoryId}/cover.${ext}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("catalog-images")
      .upload(path, file, { upsert: true });

    setUploading(false);

    if (uploadError) {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("catalog-images").getPublicUrl(path);

    await supabase.from("categories").update({ cover_image_url: publicUrl }).eq("id", categoryId);

    router.refresh();
  }

  return (
    <div className="mt-2 flex items-center gap-4">
      {currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt="Portada actual"
          className="h-16 w-16 rounded object-cover"
        />
      )}
      <div>
        <label htmlFor="cover-upload-input" className="text-sm text-primary hover:underline cursor-pointer">
          {uploading ? "Subiendo..." : "Subir portada"}
        </label>
        <input
          id="cover-upload-input"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleUpload}
          disabled={uploading}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
