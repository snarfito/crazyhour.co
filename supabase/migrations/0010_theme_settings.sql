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
