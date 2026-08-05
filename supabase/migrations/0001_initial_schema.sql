-- Crazy Hour — initial schema (Fase 0)
-- See docs/superpowers/specs/2026-08-04-crazy-hour-sistema-visual-design.md section 3

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  cover_image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  description text,
  price_cop integer not null check (price_cop >= 0),
  sku text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index products_category_id_idx on products(category_id);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  original_url text not null,
  enhanced_url text,
  gemini_processed_at timestamptz
);

create index product_images_product_id_idx on product_images(product_id);

create type order_channel as enum ('wompi', 'whatsapp');
create type order_status as enum ('pending_whatsapp', 'paid', 'shipped');

create table orders (
  id uuid primary key default gen_random_uuid(),
  channel order_channel not null,
  wompi_transaction_id text,
  status order_status not null,
  total_cop integer not null check (total_cop >= 0),
  customer_name text not null,
  customer_phone text not null,
  created_at timestamptz not null default now(),
  constraint wompi_txn_requires_wompi_channel
    check (wompi_transaction_id is null or channel = 'wompi')
);

create index orders_created_at_idx on orders(created_at);
create index orders_channel_idx on orders(channel);
create index orders_status_idx on orders(status);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_cop integer not null check (unit_price_cop >= 0)
);

create index order_items_order_id_idx on order_items(order_id);

-- Row Level Security: public catalog is publicly readable, orders are service-role only.
-- Admin writes to categories/products/product_images go through the service role key
-- (used server-side in the admin panel, Fase 1) — no public write policies needed yet.

alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Public can read categories" on categories for select using (true);
create policy "Public can read active products" on products for select using (is_active = true);
create policy "Public can read product images" on product_images for select using (true);

-- orders and order_items: no public policies at all (default-deny).
-- The storefront checkout flow and the admin panel both write through
-- server-side code using SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS entirely.
