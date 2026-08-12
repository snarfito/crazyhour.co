-- Admin roles: full vs limited access.
-- See docs/superpowers/specs/2026-08-12-crazy-hour-admin-usuarios-design.md

create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('full', 'limited')),
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;
-- No RLS policies on purpose, same default-deny model as orders/order_items/
-- settings (see 0006's comment): this table is only ever read/written from
-- Server Actions through src/lib/supabase/service.ts (service-role key),
-- with authorization enforced by verifySession()/requireFullAdmin() in
-- application code, not by an authenticated-role RLS policy.

-- "Automatically expose new tables" is disabled on this project, so
-- service_role needs an explicit GRANT despite BYPASSRLS (see 0004/0006's
-- comments for why the two checks are separate).
grant select, insert, update, delete on admin_users to service_role;
