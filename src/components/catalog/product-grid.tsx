import { ProductCard } from "./product-card";

export type ProductListItem = {
  id: string;
  name: string;
  price_cop: number;
  imageUrl: string | null;
};

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} id={p.id} name={p.name} priceCop={p.price_cop} imageUrl={p.imageUrl} />
      ))}
    </div>
  );
}
