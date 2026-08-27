"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export type ProductImageOption = { id: string; url: string };

/** Cuadrícula de miniaturas para elegir la foto de una opción — reemplaza un <select> de UUIDs ilegibles por algo que el admin reconoce a simple vista. */
export function ImagePicker({
  images,
  value,
  onChange,
}: {
  images: ProductImageOption[];
  value: string;
  onChange: (imageId: string) => void;
}) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Foto de la opción">
      <button
        type="button"
        onClick={() => onChange("")}
        aria-pressed={value === ""}
        title="Sin foto propia"
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 text-[9px] text-muted-foreground",
          value === "" ? "border-primary" : "border-border"
        )}
      >
        Sin foto
      </button>
      {images.map((img) => (
        <button
          key={img.id}
          type="button"
          onClick={() => onChange(img.id)}
          aria-pressed={value === img.id}
          title="Usar esta foto"
          className={cn(
            "relative h-10 w-10 shrink-0 overflow-hidden rounded border-2",
            value === img.id ? "border-primary" : "border-border"
          )}
        >
          <Image src={img.url} alt="" fill sizes="40px" className="object-cover" />
        </button>
      ))}
    </div>
  );
}
