alter table theme_settings
  add column shape_image_urls text[] not null default '{}';
