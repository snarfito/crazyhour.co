import { CategoryCard } from "./category-card";

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
};

export function CategoryGrid({ categories }: { categories: CategoryListItem[] }) {
  return (
    <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:grid-cols-3 lg:auto-rows-[220px] lg:grid-cols-4">
      {categories.map((c, i) => (
        <CategoryCard
          key={c.id}
          id={c.id}
          name={c.name}
          slug={c.slug}
          coverImageUrl={c.cover_image_url}
          wide={i % 5 === 4}
          index={i}
        />
      ))}
    </div>
  );
}
