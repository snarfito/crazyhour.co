-- Crazy Hour — flags an admin whose password was just set by another admin
-- (temporary-password reset from /admin/usuarios) as needing to pick their
-- own on next login. See src/lib/supabase/dal.ts verifySession().

alter table admin_users
  add column must_change_password boolean not null default false;
