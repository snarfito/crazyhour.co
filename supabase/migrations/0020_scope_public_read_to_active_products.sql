-- Security fix: "Public can read product images" (0001) and "Public can
-- read product_categories" (0013) both used `using(true)`, unlike the
-- "Public can read active products" policy on `products` itself (which
-- checks `is_active = true`). Since both tables are also granted `select`
-- to `anon`, this let anyone query the public REST API for image URLs and
-- category links of *inactive* (unpublished/draft) products — the
-- storefront hides these, but the underlying data wasn't actually private.
--
-- The admin panel still needs authenticated reads of inactive products'
-- images/categories (so admins can find and re-toggle them) — same split
-- 0005 already uses for the `products` table itself: a public policy
-- scoped to is_active, plus a separate `to authenticated using(true)`
-- policy, combined by RLS with OR.

drop policy "Public can read product images" on product_images;

create policy "Public can read images of active products"
on product_images for select
using (
  exists (select 1 from products where products.id = product_images.product_id and products.is_active = true)
);

create policy "Authenticated can read all product images"
on product_images for select
to authenticated
using (true);

drop policy "Public can read product_categories" on product_categories;

create policy "Public can read categories of active products"
on product_categories for select
using (
  exists (select 1 from products where products.id = product_categories.product_id and products.is_active = true)
);

create policy "Authenticated can read all product_categories"
on product_categories for select
to authenticated
using (true);
