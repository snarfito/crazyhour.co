create table theme_settings (
  theme text primary key check (
    theme in (
      'navidad', 'amor_y_amistad', 'halloween', 'hora_loca',
      'velitas', 'carnaval', 'dia_madre', 'dia_padre',
      'fiestas_patrias', 'grados', 'primeras_comuniones', 'baby_shower'
    )
  ),
  particle_count integer,
  min_duration numeric,
  max_duration numeric,
  min_size numeric,
  max_size numeric,
  max_opacity numeric,
  custom_css text,
  updated_at timestamptz not null default now()
);

alter table theme_settings enable row level security;
-- No RLS policies on purpose: same default-deny model as settings (0006).
-- service_role needs an explicit GRANT even though it bypasses RLS
-- (BYPASSRLS skips policy evaluation, not the separate table-level GRANT
-- check) — same lesson as 0006's grant on settings. Includes delete (unlike
-- settings, which never deletes its singleton row) because integration
-- tests need to clean up rows between runs — found the hard way when a
-- missing delete grant let cleanup fail silently and leak rows across runs.
grant select, insert, update, delete on theme_settings to service_role;
