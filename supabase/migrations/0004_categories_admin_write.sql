-- Admin write access to categories (Fase 1 Task 6). Any authenticated
-- Supabase Auth user in this project is an admin — no role differentiation
-- in this phase (see docs/superpowers/specs/2026-08-05-crazy-hour-fase-1-admin-design.md
-- section 2, same model already used for the catalog-images storage
-- policies in 0003_storage_catalog_images.sql).
--
-- Table-level GRANTs are required in addition to RLS policies because this
-- project has "Automatically expose new tables" disabled (see 0002's
-- comment). service_role carries the BYPASSRLS role attribute, but that
-- only skips RLS policy evaluation — it does NOT imply table-level GRANTs,
-- which are a separate Postgres permission layer. Without this migration,
-- admin writes to categories fail with "permission denied for table
-- categories" both via the authenticated-role path (the real admin panel,
-- through the anon-key/cookie server client from Task 1) and the
-- service_role path (this task's integration tests, which bypass RLS but
-- still need GRANTs).

grant select, insert, update, delete on categories to authenticated;
grant select, insert, update, delete on categories to service_role;

create policy "Authenticated can insert categories"
on categories for insert
to authenticated
with check (true);

create policy "Authenticated can update categories"
on categories for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete categories"
on categories for delete
to authenticated
using (true);
