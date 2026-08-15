import Image from "next/image";
import { BrandPlaceholder } from "./brand-placeholder";

export function CatalogImage({
  src,
  seed,
  label,
  className,
  labelClassName = "text-sm sm:text-base",
  sizes = "(max-width: 768px) 50vw, 25vw",
}: {
  src: string | null;
  seed: string;
  label: string;
  className?: string;
  labelClassName?: string;
  sizes?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <BrandPlaceholder seed={seed} />
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/70 to-transparent"
      />
      <p className={`absolute inset-x-0 bottom-0 line-clamp-2 p-2 font-heading font-bold text-white ${labelClassName}`}>
        {label}
      </p>
    </div>
  );
}
