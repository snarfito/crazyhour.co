"use client";

import { useCallback, useState } from "react";
import { ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUpload } from "../image-upload";

type ProductImage = { id: string; original_url: string; enhanced_url: string | null };

export function ProductImageModal({ productId, productName }: { productId: string; productName: string }) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);

  const loadImages = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("product_images")
      .select("id, original_url, enhanced_url")
      .eq("product_id", productId);
    setImages(data ?? []);
    setLoading(false);
  }, [productId]);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) loadImages();
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <ImagePlus />
            Editar imagen
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fotos de {productName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <ImageUpload productId={productId} images={images} onChange={loadImages} />
        )}
      </DialogContent>
    </Dialog>
  );
}
