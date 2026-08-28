-- 0019 scoped catalog-images writes to a strict allowlist of top-level
-- folders (products/, categories/), each gated on its matching admin
-- permission — event-shapes/ (added for per-theme animation PNG uploads)
-- wasn't in that allowlist, so every upload there was rejected by RLS with
-- "new row violates row-level security policy" regardless of the uploading
-- admin's permissions. has_admin_permission() also didn't know about
-- 'animaciones' at all.

create or replace function has_admin_permission(permission text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admin_users
    where id = auth.uid()
    and case permission
      when 'productos' then can_productos
      when 'categorias' then can_categorias
      when 'animaciones' then can_animaciones
      else false
    end
  );
$$;

drop policy "Admins can upload catalog images for their sections" on storage.objects;
drop policy "Admins can update catalog images for their sections" on storage.objects;
drop policy "Admins can delete catalog images for their sections" on storage.objects;

create policy "Admins can upload catalog images for their sections"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'catalog-images'
  and (
    (storage.foldername(name))[1] = 'products' and has_admin_permission('productos')
    or (storage.foldername(name))[1] = 'categories' and has_admin_permission('categorias')
    or (storage.foldername(name))[1] = 'event-shapes' and has_admin_permission('animaciones')
  )
);

create policy "Admins can update catalog images for their sections"
on storage.objects for update
to authenticated
using (
  bucket_id = 'catalog-images'
  and (
    (storage.foldername(name))[1] = 'products' and has_admin_permission('productos')
    or (storage.foldername(name))[1] = 'categories' and has_admin_permission('categorias')
    or (storage.foldername(name))[1] = 'event-shapes' and has_admin_permission('animaciones')
  )
);

create policy "Admins can delete catalog images for their sections"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'catalog-images'
  and (
    (storage.foldername(name))[1] = 'products' and has_admin_permission('productos')
    or (storage.foldername(name))[1] = 'categories' and has_admin_permission('categorias')
    or (storage.foldername(name))[1] = 'event-shapes' and has_admin_permission('animaciones')
  )
);
