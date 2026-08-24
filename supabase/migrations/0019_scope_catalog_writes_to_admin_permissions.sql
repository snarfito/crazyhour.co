-- Security fix: catalog write RLS (0004/0005/0013) and the catalog-images
-- storage policies (0003) grant INSERT/UPDATE/DELETE to any `authenticated`
-- Supabase Auth user with `using(true)`/`with check(true)` — they never
-- check admin_users at all. The app enforces per-section permissions
-- (can_productos/can_categorias) only in Server Actions, so an admin with
-- e.g. only can_pedidos=true (or a revoked ex-admin whose JWT hasn't
-- expired) can still write directly via the PostgREST/Storage APIs using
-- their own session, bypassing every app-level check.
--
-- admin_users itself has RLS enabled with zero policies (default-deny, see
-- 0012's comment) — a plain EXISTS subquery against it from another table's
-- policy would always evaluate false for the `authenticated` role, since
-- policy subqueries still respect the referenced table's RLS for the
-- calling role. This SECURITY DEFINER function is the standard escape
-- hatch: it runs with the privileges of its owner (the migration role,
-- which bypasses RLS), so it can read admin_users regardless of the
-- caller's own access to that table.

create or replace function has_admin_permission(permission text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admin_users
    where id = auth.uid()
    and case permission
      when 'productos' then can_productos
      when 'categorias' then can_categorias
      else false
    end
  );
$$;

revoke all on function has_admin_permission(text) from public;
grant execute on function has_admin_permission(text) to authenticated;

-- categories (replaces 0004's insert/update/delete policies)
drop policy "Authenticated can insert categories" on categories;
drop policy "Authenticated can update categories" on categories;
drop policy "Authenticated can delete categories" on categories;

create policy "Admins with categorias permission can insert categories"
on categories for insert
to authenticated
with check (has_admin_permission('categorias'));

create policy "Admins with categorias permission can update categories"
on categories for update
to authenticated
using (has_admin_permission('categorias'))
with check (has_admin_permission('categorias'));

create policy "Admins with categorias permission can delete categories"
on categories for delete
to authenticated
using (has_admin_permission('categorias'));

-- products (replaces 0005's insert/update/delete policies)
drop policy "Authenticated can insert products" on products;
drop policy "Authenticated can update products" on products;
drop policy "Authenticated can delete products" on products;

create policy "Admins with productos permission can insert products"
on products for insert
to authenticated
with check (has_admin_permission('productos'));

create policy "Admins with productos permission can update products"
on products for update
to authenticated
using (has_admin_permission('productos'))
with check (has_admin_permission('productos'));

create policy "Admins with productos permission can delete products"
on products for delete
to authenticated
using (has_admin_permission('productos'));

-- product_images (replaces 0005's insert/update/delete policies; only ever
-- written from productos/actions.ts and productos/editor/actions.ts, both
-- gated on can_productos)
drop policy "Authenticated can insert product_images" on product_images;
drop policy "Authenticated can update product_images" on product_images;
drop policy "Authenticated can delete product_images" on product_images;

create policy "Admins with productos permission can insert product_images"
on product_images for insert
to authenticated
with check (has_admin_permission('productos'));

create policy "Admins with productos permission can update product_images"
on product_images for update
to authenticated
using (has_admin_permission('productos'))
with check (has_admin_permission('productos'));

create policy "Admins with productos permission can delete product_images"
on product_images for delete
to authenticated
using (has_admin_permission('productos'));

-- product_categories (replaces 0013's insert/update/delete policies; only
-- ever written from productos/actions.ts and productos/editor/actions.ts,
-- both gated on can_productos)
drop policy "Authenticated can insert product_categories" on product_categories;
drop policy "Authenticated can update product_categories" on product_categories;
drop policy "Authenticated can delete product_categories" on product_categories;

create policy "Admins with productos permission can insert product_categories"
on product_categories for insert
to authenticated
with check (has_admin_permission('productos'));

create policy "Admins with productos permission can update product_categories"
on product_categories for update
to authenticated
using (has_admin_permission('productos'))
with check (has_admin_permission('productos'));

create policy "Admins with productos permission can delete product_categories"
on product_categories for delete
to authenticated
using (has_admin_permission('productos'));

-- catalog-images storage bucket (replaces 0003's insert/update/delete
-- policies): objects live under a `products/...` or `categories/...` path
-- prefix (see productos/image-upload.tsx, categorias/cover-upload.tsx), so
-- the matching permission is derived from the top-level folder.
drop policy "Authenticated can upload catalog images" on storage.objects;
drop policy "Authenticated can update catalog images" on storage.objects;
drop policy "Authenticated can delete catalog images" on storage.objects;

create policy "Admins can upload catalog images for their sections"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'catalog-images'
  and (
    (storage.foldername(name))[1] = 'products' and has_admin_permission('productos')
    or (storage.foldername(name))[1] = 'categories' and has_admin_permission('categorias')
  )
);

create policy "Admins can update catalog images for their sections"
on storage.objects for update
to authenticated
using (
  bucket_id = 'catalog-images'
  and (
    (storage.foldername(name))[1] = 'products' and has_admin_permission('productos')
    or (storage.foldername(name))[1] = 'categories' and has_admin_permission('categorias')
  )
);

create policy "Admins can delete catalog images for their sections"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'catalog-images'
  and (
    (storage.foldername(name))[1] = 'products' and has_admin_permission('productos')
    or (storage.foldername(name))[1] = 'categories' and has_admin_permission('categorias')
  )
);
