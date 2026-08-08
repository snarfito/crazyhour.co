-- Fase 3 — carrito, pagos y WhatsApp: pending_wompi status + settings table.
-- See docs/superpowers/specs/2026-08-08-crazy-hour-fase-3-carrito-pagos-design.md

alter type order_status add value 'pending_wompi' after 'pending_whatsapp';

-- Singleton table: the boolean PK + check(id) trick means only one row can
-- ever exist (id must be true, and true can't be inserted twice without
-- violating the PK uniqueness) — no application code needed to enforce it.
create table settings (
  id boolean primary key default true check (id),
  whatsapp_number text not null,
  contact_email text,
  contact_phone text,
  updated_at timestamptz not null default now()
);

insert into settings (whatsapp_number) values ('');

alter table settings enable row level security;
-- No RLS policies on purpose: settings follows the same default-deny model
-- as orders/order_items (see 0001's "orders and order_items: no public
-- policies at all" comment). Both the public site (reading whatsapp_number
-- for the checkout/floating button) and the admin Ajustes screen go through
-- src/lib/supabase/service.ts (service-role key), with writes gated by
-- verifySession() in the (protected) admin layout — not by an
-- authenticated-role RLS policy, since the admin panel never uses the
-- cookie-based client for this table.

-- orders/order_items were created in 0001 but never granted to
-- service_role (0002's grant migration only covers anon/authenticated
-- default-deny for them). This project has "Automatically expose new
-- tables" disabled, so — same lesson as 0004/0005's comments for
-- categories/products — service_role needs an explicit GRANT even though
-- it bypasses RLS (BYPASSRLS skips policy evaluation, not the separate
-- table-level GRANT check). Fase 3 is the first code that actually writes
-- to these tables, so it's the first migration that needs to grant them.
grant select, insert, update on orders to service_role;
grant select, insert on order_items to service_role;
grant select, update on settings to service_role;
