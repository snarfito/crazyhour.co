alter table settings
  add column active_event_theme text not null default 'none'
  constraint valid_event_theme check (
    active_event_theme in ('none', 'navidad', 'amor_y_amistad', 'halloween', 'hora_loca')
  );
