"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandPlaceholder } from "@/components/catalog/brand-placeholder";

export function ImageGallery({
  images,
  productName,
  selectedUrl,
}: {
  images: { url: string; alt: string }[];
  productName: string;
  /** Cuando el usuario elige una opción de color con imagen propia, salta a esa foto sin bloquear el click manual en miniaturas. */
  selectedUrl?: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // "Adjust state during render" (React docs) instead of an effect: only
  // reacts when selectedUrl itself changes between renders, so it jumps to
  // the chosen color's photo without fighting a manual thumbnail click.
  const [prevSelectedUrl, setPrevSelectedUrl] = useState(selectedUrl);
  if (selectedUrl !== prevSelectedUrl) {
    setPrevSelectedUrl(selectedUrl);
    if (selectedUrl) {
      const index = images.findIndex((img) => img.url === selectedUrl);
      if (index !== -1) setActiveIndex(index);
    }
  }

  // Scrolling the strip is a real side effect (imperative DOM), so this one
  // stays a genuine effect — runs after every commit where activeIndex
  // changed, regardless of whether a thumbnail click or a color pick caused
  // it. behavior: "auto" (not "smooth") on purpose — smooth scrollIntoView
  // didn't reliably animate in testing, and an instant jump also means this
  // never fights prefers-reduced-motion with no extra check needed.
  useEffect(() => {
    thumbnailRefs.current[activeIndex]?.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
  }, [activeIndex]);

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
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              data-testid="gallery-thumbnail"
              aria-pressed={i === activeIndex}
              ref={(el) => {
                thumbnailRefs.current[i] = el;
              }}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg transition-all",
                i === activeIndex
                  ? "border-2 border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "border border-border opacity-60 hover:opacity-100"
              )}
            >
              <Image src={img.url} alt={img.alt} fill sizes="64px" className="object-cover" />
              {i === activeIndex && (
                <span className="absolute right-0.5 bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
