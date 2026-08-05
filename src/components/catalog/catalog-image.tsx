import Image from "next/image";
import { BrandPlaceholder } from "./brand-placeholder";

export function CatalogImage({
  src,
  alt,
  label,
  seed,
  className,
}: {
  src: string | null;
  alt: string;
  label: string;
  seed: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={className}>
        <BrandPlaceholder label={label} seed={seed} />
      </div>
    );
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
    </div>
  );
}
