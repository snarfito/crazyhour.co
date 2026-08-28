import Link from "next/link";
import Image from "next/image";
import { BrandPlaceholder } from "./brand-placeholder";

export function FeaturedCategoryStrip({
  name,
  slug,
  description,
  coverImageUrl,
}: {
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
}) {
  return (
    <section className="px-4 py-4">
      <Link
        href={`/${slug}`}
        className="neon-border mx-auto flex max-w-5xl items-center gap-4 rounded-2xl border border-brand-green/45 bg-card/55 p-4 text-brand-green transition-transform duration-150 ease-out active:scale-[0.99] sm:gap-6 sm:p-6"
      >
        <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-2xl sm:w-40">
          {coverImageUrl ? (
            <Image src={coverImageUrl} alt="" fill sizes="(max-width: 640px) 96px, 160px" className="object-cover" />
          ) : (
            <BrandPlaceholder seed={slug} />
          )}
        </div>
        <div className="min-w-0 text-foreground">
          <span className="sr-only">Categoría destacada: </span>
          <span
            aria-hidden="true"
            className="text-glow block font-mono text-[10px] font-medium uppercase tracking-widest text-brand-green"
          >
            destacada
          </span>
          <span className="mt-1 block font-heading text-lg font-black sm:text-xl">{name}</span>
          {description && (
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </Link>
    </section>
  );
}
