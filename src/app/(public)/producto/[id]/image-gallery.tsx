"use client";

import { useState } from "react";
import Image from "next/image";
import { BrandPlaceholder } from "@/components/catalog/brand-placeholder";

export function ImageGallery({
  images,
  productName,
}: {
  images: { url: string; alt: string }[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg">
        <BrandPlaceholder seed={productName} />
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        <Image
          src={active.url}
          alt={active.alt}
          fill
          sizes="(max-width: 768px) 60vw, 50vw"
          className="object-cover"
          data-testid="gallery-main-image"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              data-testid="gallery-thumbnail"
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-16 overflow-hidden rounded border ${
                i === activeIndex ? "border-primary" : "border-border"
              }`}
            >
              <Image src={img.url} alt={img.alt} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
