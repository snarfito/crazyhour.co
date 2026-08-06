import Link from "next/link";
import { CatalogImage } from "./catalog-image";
import { formatCOP } from "@/lib/format";

export function ProductCard({
  id,
  name,
  priceCop,
  imageUrl,
  isNew,
  index,
}: {
  id: string;
  name: string;
  priceCop: number;
  imageUrl: string | null;
  isNew: boolean;
  index: number;
}) {
  return (
    <Link
      href={`/producto/${id}`}
      style={{ "--stagger-delay": `${index * 40}ms` } as React.CSSProperties}
      className="animate-stagger-in block overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-200 ease-out hover:-translate-y-1"
    >
      <div className="relative">
        <CatalogImage src={imageUrl} seed={id} label={name} className="aspect-square" />
        {isNew && (
          <span className="absolute left-2 top-2 z-10 -rotate-6 rounded-full bg-brand-yellow px-2.5 py-1 font-accent text-base font-bold text-[#16232e] shadow-md">
            ¡nuevo!
          </span>
        )}
      </div>
      <div className="relative border-t border-dashed border-border/60 px-3 py-3">
        <span
          aria-hidden="true"
          className="absolute -top-[9px] -left-[9px] h-[18px] w-[18px] rounded-full bg-background"
        />
        <span
          aria-hidden="true"
          className="absolute -top-[9px] -right-[9px] h-[18px] w-[18px] rounded-full bg-background"
        />
        <p className="font-heading text-base font-extrabold">{formatCOP(priceCop)}</p>
      </div>
    </Link>
  );
}
