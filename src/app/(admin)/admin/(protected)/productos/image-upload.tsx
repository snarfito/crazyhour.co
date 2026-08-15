"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EnhanceButton } from "./enhance-button";
import { createProductImagePlaceholder, setProductImageUrl, deleteProductImage } from "./actions";

type ProductImage = { id: string; original_url: string; enhanced_url: string | null };

export function ImageUpload({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: ProductImage[];
  onChange?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (uploading) return;
      const file = Array.from(e.clipboardData?.items ?? [])
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();
      if (file) uploadFile(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, uploading]);

  async function uploadFile(file: File) {
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
    onChange?.();
  }

  return (
    <div className="mt-2">
      <div className="flex flex-col gap-4">
        {images.map((img) => (
          <div key={img.id} className="rounded-lg border border-border p-3">
            <div className={img.enhanced_url ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Original</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.original_url}
                  alt="Foto original"
                  className="h-64 w-full rounded-md border border-border bg-white object-contain"
                />
              </div>
              {img.enhanced_url && (
                <div>
                  <p className="mb-1 text-xs font-medium text-brand-green">Mejorada</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.enhanced_url}
                    alt="Foto mejorada"
                    className="h-64 w-full rounded-md border border-border bg-white object-contain"
                  />
                </div>
              )}
            </div>
            <div className="mt-3">
              <EnhanceButton imageId={img.id} onEnhanced={onChange} />
            </div>
          </div>
        ))}
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) uploadFile(file);
        }}
        className={cn(
          "mt-3 flex flex-col items-start gap-2 rounded-lg border-2 border-dashed border-transparent p-2",
          dragOver && "border-primary bg-primary/5"
        )}
      >
        <label
          htmlFor="product-image-input"
          className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer", uploading && "pointer-events-none opacity-50")}
        >
          <Upload />
          {uploading ? "Subiendo..." : "Subir foto"}
        </label>
        <p className="text-xs text-muted-foreground">
          O arrastra una imagen aquí, o pégala con {"Cmd/Ctrl+V"}
        </p>
      </div>
      <input
        id="product-image-input"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = "";
        }}
        disabled={uploading}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
