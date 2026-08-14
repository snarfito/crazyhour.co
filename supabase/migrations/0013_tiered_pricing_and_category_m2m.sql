-- Crazy Hour — tiered pricing (unidad / media paca / paca completa) +
-- product↔category many-to-many. See
-- docs/superpowers/specs/2026-08-13-crazy-hour-precios-categorias-m2m-design.md
-- sections 2, 3, 4, 7.

-- Step A: the join table, created before touching products.category_id so
-- the existing single-category assignment can be preserved into it below.
create table product_categories (
  product_id uuid not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete restrict,
  primary key (product_id, category_id)
);

create index product_categories_category_id_idx on product_categories(category_id);

-- Step B: preserve every product's current category assignment before
-- products.category_id is dropped in step E. The catalog loaded so far is
-- test data (spec section 7) — this is a mechanical carry-forward, not a
-- business decision.
insert into product_categories (product_id, category_id)
select id, category_id from products;

-- Step C: unit_price_cop — nullable first so the backfill below has
-- somewhere to write before the not-null constraint applies, so the table
-- is never left with a broken not-null constraint mid-migration.
alter table products add column unit_price_cop integer;
update products set unit_price_cop = price_cop;
alter table products alter column unit_price_cop set not null;
alter table products add constraint products_unit_price_cop_check check (unit_price_cop >= 0);

-- Step D: the two pack tiers — left null, filled in by the real catalog
-- re-load (spec section 7, out of scope for this migration).
alter table products add column pack1_qty integer;
alter table products add column pack1_price_cop integer;
alter table products add column pack2_qty integer;
alter table products add column pack2_price_cop integer;

alter table products add constraint products_pack1_price_requires_qty
  check (pack1_price_cop is null or pack1_qty is not null);
alter table products add constraint products_pack2_price_requires_qty
  check (pack2_price_cop is null or pack2_qty is not null);
alter table products add constraint products_pack1_qty_gt_pack2_qty
  check (pack1_qty is null or pack2_qty is null or pack1_qty > pack2_qty);
alter table products add constraint products_pack1_price_cop_check
  check (pack1_price_cop is null or pack1_price_cop >= 0);
alter table products add constraint products_pack2_price_cop_check
  check (pack2_price_cop is null or pack2_price_cop >= 0);

-- Step E: drop the columns this migration replaces.
alter table products drop column price_cop;
alter table products drop column category_id;

-- RLS + grants for product_categories: same public-read/authenticated-write
-- model as categories/products (0002/0004/0005). "Automatically expose new
-- tables" is disabled on this project, so service_role needs an explicit
-- GRANT despite BYPASSRLS (see 0004's comment for why the two checks are
-- separate).
alter table product_categories enable row level security;

create policy "Public can read product_categories"
on product_categories for select
using (true);

create policy "Authenticated can insert product_categories"
on product_categories for insert
to authenticated
with check (true);

create policy "Authenticated can update product_categories"
on product_categories for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete product_categories"
on product_categories for delete
to authenticated
using (true);

grant select on product_categories to anon, authenticated;
grant insert, update, delete on product_categories to authenticated;
grant select, insert, update, delete on product_categories to service_role;
