-- Public catalog image bucket: readable by anyone, writable only by
-- authenticated users (any Supabase Auth user in this project is an admin —
-- see docs/superpowers/specs/2026-08-05-crazy-hour-fase-1-admin-design.md
-- section 2, no role differentiation in this phase).

insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do nothing;

create policy "Public can read catalog images"
on storage.objects for select
using (bucket_id = 'catalog-images');

create policy "Authenticated can upload catalog images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'catalog-images');

create policy "Authenticated can update catalog images"
on storage.objects for update
to authenticated
using (bucket_id = 'catalog-images');

create policy "Authenticated can delete catalog images"
on storage.objects for delete
to authenticated
using (bucket_id = 'catalog-images');
