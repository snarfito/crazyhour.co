-- Product variants (color, talla, y N atributos futuros). See
-- docs/superpowers/plans (o el plan aprobado en la sesión) para el diseño
-- completo: un solo grupo de atributo por producto puede afectar precio
-- (product_attributes_one_price_driver), los demás son descriptivos y solo
-- eligen imagen. Sin stock/inventario todavía — se deja para una fase
-- futura a propósito.

create table product_attributes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  kind text not null check (kind in ('color', 'size', 'generic')),
  display_name text not null,
  affects_price boolean not null default false,
  -- Solo un grupo por producto puede tener fotos ligadas a sus opciones
  -- (normalmente Color, pero no forzado a kind='color' — es una elección
  -- del admin, ver product_attributes_one_photo_group). Los demás grupos no
  -- muestran el picker de fotos ni cambian la imagen del producto.
  has_photos boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, display_name)
);

create index product_attributes_product_id_idx on product_attributes(product_id);

-- Un solo atributo por producto puede definir el precio (evita tener que
-- precificar cada combinación color×talla — ver nota de diseño arriba).
create unique index product_attributes_one_price_driver
  on product_attributes (product_id)
  where affects_price;

-- Un solo atributo por producto puede tener fotos por opción.
create unique index product_attributes_one_photo_group
  on product_attributes (product_id)
  where has_photos;

-- Los 3 precios (unidad/media paca/paca completa) viven en la opción, no en
-- el producto, para que cada talla pueda tener su propio precio en cada
-- escalón. La CANTIDAD de cada escalón (products.pack1_qty/pack2_qty) sigue
-- siendo del producto y es la misma para todas sus opciones (decisión del
-- usuario, 26 ago) — solo el precio en ese escalón varía por opción. Cuando
-- el producto tiene un grupo que affects_price, sus propios
-- unit_price_cop/pack1_price_cop/pack2_price_cop dejan de usarse por
-- completo (ver checkout/actions.ts) — nunca se mezclan precio de producto
-- y precio de opción para un mismo pedido.
create table attribute_options (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references product_attributes(id) on delete cascade,
  display_name text not null,
  color_hex text,
  unit_price_cop integer check (unit_price_cop is null or unit_price_cop >= 0),
  pack1_price_cop integer check (pack1_price_cop is null or pack1_price_cop >= 0),
  pack2_price_cop integer check (pack2_price_cop is null or pack2_price_cop >= 0),
  product_image_id uuid references product_images(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (attribute_id, display_name)
);

create index attribute_options_attribute_id_idx on attribute_options(attribute_id);
create index attribute_options_product_image_id_idx on attribute_options(product_image_id);

-- Snapshot de la selección en el pedido: `order_items` ya no puede resolver
-- "qué color/talla se pidió" solo con product_id, y las opciones pueden
-- renombrarse o borrarse después del pedido (a diferencia de products, que
-- usa on delete restrict) — por eso attribute_option_id es nullable con
-- on delete set null, con el nombre siempre guardado aparte.
alter table order_items add column selected_attribute_summary text;

create table order_item_selections (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  attribute_option_id uuid references attribute_options(id) on delete set null,
  attribute_display_name text not null,
  option_display_name text not null,
  unique (order_item_id, attribute_option_id)
);

create index order_item_selections_order_item_id_idx on order_item_selections(order_item_id);

-- RLS: mismo patrón que products/product_images (0001/0019/0020) — lectura
-- pública solo de catálogo activo, lectura completa para cualquier admin
-- autenticado, escritura solo con el permiso "productos".
alter table product_attributes enable row level security;
alter table attribute_options enable row level security;

create policy "Public can read attributes of active products"
on product_attributes for select
using (
  exists (select 1 from products where products.id = product_attributes.product_id and products.is_active = true)
);

create policy "Authenticated can read all product_attributes"
on product_attributes for select
to authenticated
using (true);

create policy "Admins with productos permission can insert product_attributes"
on product_attributes for insert
to authenticated
with check (has_admin_permission('productos'));

create policy "Admins with productos permission can update product_attributes"
on product_attributes for update
to authenticated
using (has_admin_permission('productos'))
with check (has_admin_permission('productos'));

create policy "Admins with productos permission can delete product_attributes"
on product_attributes for delete
to authenticated
using (has_admin_permission('productos'));

create policy "Public can read active options of active products"
on attribute_options for select
using (
  is_active = true
  and exists (
    select 1
    from product_attributes pa
    join products p on p.id = pa.product_id
    where pa.id = attribute_options.attribute_id and p.is_active = true
  )
);

create policy "Authenticated can read all attribute_options"
on attribute_options for select
to authenticated
using (true);

create policy "Admins with productos permission can insert attribute_options"
on attribute_options for insert
to authenticated
with check (has_admin_permission('productos'));

create policy "Admins with productos permission can update attribute_options"
on attribute_options for update
to authenticated
using (has_admin_permission('productos'))
with check (has_admin_permission('productos'));

create policy "Admins with productos permission can delete attribute_options"
on attribute_options for delete
to authenticated
using (has_admin_permission('productos'));

-- order_item_selections: igual que orders/order_items (0001) — sin
-- políticas públicas (default-deny). Solo se escribe/lee desde Server
-- Actions con SUPABASE_SERVICE_ROLE_KEY, que ignora RLS por completo.
alter table order_item_selections enable row level security;

grant select, insert, update, delete on product_attributes to service_role;
grant select, insert, update, delete on attribute_options to service_role;
grant select, insert, update, delete on order_item_selections to service_role;
grant select, insert, update, delete on product_attributes to authenticated;
grant select, insert, update, delete on attribute_options to authenticated;
grant select on product_attributes, attribute_options to anon;
