import Image from "next/image";
import { BrandPlaceholder } from "./brand-placeholder";

export function CatalogImage({
  src,
  seed,
  label,
  className,
}: {
  src: string | null;
  seed: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
      ) : (
        <BrandPlaceholder seed={seed} />
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/70 to-transparent"
      />
      <p className="absolute inset-x-0 bottom-0 p-2 font-heading text-sm font-bold text-white sm:text-base">
        {label}
      </p>
    </div>
  );
}
