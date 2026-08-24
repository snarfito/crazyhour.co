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
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:grid-cols-2 sm:items-center">
        <div className="relative aspect-video overflow-hidden rounded-2xl">
          {coverImageUrl ? (
            <Image src={coverImageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
          ) : (
            <BrandPlaceholder seed={slug} />
          )}
        </div>
        <div>
          <span className="block font-heading text-sm font-bold uppercase tracking-wide text-primary">{name}</span>
          {description && <p className="mt-2 text-base text-muted-foreground">{description}</p>}
          <Link
            href={`/${slug}`}
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-3 font-heading text-sm font-extrabold text-primary-foreground transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            {`Ver ${name} →`}
          </Link>
        </div>
      </div>
    </section>
  );
}
