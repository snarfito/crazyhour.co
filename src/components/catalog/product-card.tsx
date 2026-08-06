import Link from "next/link";
import { CatalogImage } from "./catalog-image";
import { formatCOP } from "@/lib/format";

export function ProductCard({
  id,
  name,
  priceCop,
  imageUrl,
}: {
  id: string;
  name: string;
  priceCop: number;
  imageUrl: string | null;
}) {
  return (
    <Link href={`/producto/${id}`} className="block overflow-hidden rounded-lg border border-border">
      <CatalogImage src={imageUrl} label={name} seed={id} className="aspect-square" />
      <div className="p-2">
        <p className="line-clamp-2 text-sm font-medium">{name}</p>
        <p className="mt-1 font-heading text-sm font-bold">{formatCOP(priceCop)}</p>
      </div>
    </Link>
  );
}
