import Link from "next/link";
import { CatalogImage } from "./catalog-image";

export function CategoryCard({
  id,
  name,
  slug,
  coverImageUrl,
}: {
  id: string;
  name: string;
  slug: string;
  coverImageUrl: string | null;
}) {
  return (
    <Link href={`/${slug}`} className="block overflow-hidden rounded-lg border border-border">
      <CatalogImage
        src={coverImageUrl}
        alt={name}
        label={name}
        seed={id}
        className="aspect-square"
      />
      <p className="p-2 text-center font-heading text-sm font-bold">{name}</p>
    </Link>
  );
}
