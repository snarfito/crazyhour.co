-- Admin write access to products and product_images (Fase 1 Task 8). Any
-- authenticated Supabase Auth user in this project is an admin — no role
-- differentiation in this phase (see docs/superpowers/specs/2026-08-05-crazy-hour-fase-1-admin-design.md
-- section 2, same model already used for 0003's storage policies and
-- 0004's categories admin-write grants).
--
-- Table-level GRANTs are required in addition to RLS policies because this
-- project has "Automatically expose new tables" disabled (see 0002's
-- comment). service_role carries the BYPASSRLS role attribute, but that
-- only skips RLS policy evaluation — it does NOT imply table-level GRANTs,
-- which are a separate Postgres permission layer. Without this migration,
-- admin writes to products/product_images fail with "permission denied for
-- table products" / "permission denied for table product_images" both via
-- the authenticated-role path (the real admin panel, through the anon-key/
-- cookie server client from Task 1) and the service_role path (this task's
-- integration tests, which bypass RLS but still need GRANTs).
--
-- products already has a public SELECT grant from 0002_grant_public_read.sql;
-- product_images has a public SELECT grant too (0002) but no write grants at
-- all yet, since 0002 was read-only.

grant select, insert, update, delete on products to authenticated;
grant select, insert, update, delete on products to service_role;

grant insert, update, delete on product_images to authenticated;
grant select, insert, update, delete on product_images to service_role;

-- 0001's "Public can read active products" policy restricts SELECT to
-- is_active = true for every role (it has no `to` clause, so it applies to
-- the public pseudo-role, which includes authenticated). That's correct for
-- the storefront but wrong for the admin panel: the products list page
-- (this task) needs an authenticated admin to see inactive products too, so
-- they can find and re-toggle them. RLS combines multiple permissive
-- policies for the same command with OR, so adding this policy widens
-- access for authenticated without touching what anon can see.
create policy "Authenticated can read all products"
on products for select
to authenticated
using (true);

create policy "Authenticated can insert products"
on products for insert
to authenticated
with check (true);

create policy "Authenticated can update products"
on products for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete products"
on products for delete
to authenticated
using (true);

create policy "Authenticated can insert product_images"
on product_images for insert
to authenticated
with check (true);

create policy "Authenticated can update product_images"
on product_images for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete product_images"
on product_images for delete
to authenticated
using (true);
