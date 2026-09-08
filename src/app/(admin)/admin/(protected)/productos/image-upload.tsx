"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EnhanceButton } from "./enhance-button";
import { uploadProductImage } from "./upload-product-image";
import { deleteProductImage } from "./actions";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

    try {
      await uploadProductImage(productId, file);
    } catch {
      setUploading(false);
      setError("No se pudo subir la imagen. Intenta de nuevo.");
      return;
    }

    setUploading(false);
    router.refresh();
    onChange?.();
  }

  async function removeImage(imageId: string) {
    if (!window.confirm("¿Eliminar esta foto? No se podrá deshacer.")) return;

    setError(null);
    setDeletingId(imageId);
    try {
      await deleteProductImage(imageId);
      router.refresh();
      onChange?.();
    } catch {
      setError("No se pudo eliminar la foto. Intenta de nuevo.");
    } finally {
      setDeletingId(null);
    }
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
            <div className="mt-3 flex items-center gap-2">
              <EnhanceButton imageId={img.id} onEnhanced={onChange} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={deletingId === img.id}
                onClick={() => removeImage(img.id)}
              >
                <Trash2 />
                {deletingId === img.id ? "Eliminando..." : "Eliminar"}
              </Button>
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
