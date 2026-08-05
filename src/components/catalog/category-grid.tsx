import { CategoryCard } from "./category-card";

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
};

export function CategoryGrid({ categories }: { categories: CategoryListItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => (
        <CategoryCard
          key={c.id}
          id={c.id}
          name={c.name}
          slug={c.slug}
          coverImageUrl={c.cover_image_url}
        />
      ))}
    </div>
  );
}
