alter table settings
  add column image_provider text not null default 'gemini'
  constraint valid_image_provider check (image_provider in ('gemini', 'openai'));
