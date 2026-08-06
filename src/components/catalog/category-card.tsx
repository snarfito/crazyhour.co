import Link from "next/link";
import { CatalogImage } from "./catalog-image";

export function CategoryCard({
  id,
  name,
  slug,
  coverImageUrl,
  wide,
  index,
}: {
  id: string;
  name: string;
  slug: string;
  coverImageUrl: string | null;
  wide: boolean;
  index: number;
}) {
  return (
    <Link
      href={`/${slug}`}
      style={{ "--stagger-delay": `${index * 40}ms` } as React.CSSProperties}
      className={`animate-stagger-in block overflow-hidden rounded-2xl border border-border transition-transform duration-200 ease-out hover:-translate-y-1 ${wide ? "col-span-2" : ""}`}
    >
      <CatalogImage
        src={coverImageUrl}
        seed={id}
        label={name}
        className="h-full w-full"
        sizes={wide ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
      />
    </Link>
  );
}
