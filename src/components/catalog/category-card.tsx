import Link from "next/link";
import { CatalogImage } from "./catalog-image";

const BORDER_CYCLE = [
  "border-brand-cyan/40 text-brand-cyan",
  "border-brand-purple/40 text-brand-purple",
  "border-brand-yellow/40 text-brand-yellow",
  "border-brand-green/40 text-brand-green",
];

export function CategoryCard({
  id,
  name,
  slug,
  coverImageUrl,
  wide,
  index,
  productCount,
}: {
  id: string;
  name: string;
  slug: string;
  coverImageUrl: string | null;
  wide: boolean;
  index: number;
  productCount: number;
}) {
  const accentClass = index % 2 === 0 ? "bg-brand-pink" : "bg-brand-green";
  const borderClass = BORDER_CYCLE[index % BORDER_CYCLE.length];
  const countLabel = `${productCount} ${productCount === 1 ? "producto" : "productos"}`;

  return (
    <Link
      href={`/${slug}`}
      style={{ "--stagger-delay": `${index * 40}ms` } as React.CSSProperties}
      className={`neon-border-soft animate-stagger-in block overflow-hidden rounded-2xl border transition-transform duration-200 ease-out hover:-translate-y-1 ${borderClass} ${wide ? "col-span-2" : ""}`}
    >
      <div className="relative h-full w-full">
        <CatalogImage
          src={coverImageUrl}
          seed={id}
          label={name}
          className="h-full w-full"
          labelClassName="text-lg sm:text-xl"
          sizes={wide ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
        />
        <span
          className={`absolute left-2 top-2 z-10 rounded-full ${accentClass} px-2 py-0.5 font-heading text-xs font-bold text-white`}
        >
          {`Nº ${String(index + 1).padStart(2, "0")}`}
        </span>
        <span className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
          {countLabel}
        </span>
      </div>
    </Link>
  );
}
