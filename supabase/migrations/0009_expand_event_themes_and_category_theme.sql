alter table settings drop constraint valid_event_theme;
alter table settings add constraint valid_event_theme check (
  active_event_theme in (
    'none', 'navidad', 'amor_y_amistad', 'halloween', 'hora_loca',
    'velitas', 'carnaval', 'dia_madre', 'dia_padre',
    'fiestas_patrias', 'grados', 'primeras_comuniones', 'baby_shower'
  )
);

alter table categories add column animation_theme text
  constraint valid_category_animation_theme check (
    animation_theme is null or animation_theme in (
      'none', 'navidad', 'amor_y_amistad', 'halloween', 'hora_loca',
      'velitas', 'carnaval', 'dia_madre', 'dia_padre',
      'fiestas_patrias', 'grados', 'primeras_comuniones', 'baby_shower'
    )
  );
