import { ProductGrid, type ProductListItem } from "./product-grid";

export function RelatedProducts({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="font-heading text-xl font-extrabold">También te puede servir</h2>
      <div className="mt-4">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
