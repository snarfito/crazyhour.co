-- Crazy Hour — permisos admin por sección (reemplaza el modelo role
-- full/limited de 0012). See
-- docs/superpowers/specs/2026-08-13-crazy-hour-roles-permisos-seccion-design.md

alter table admin_users
  add column can_pedidos boolean not null default false,
  add column can_productos boolean not null default false,
  add column can_categorias boolean not null default false,
  add column can_ajustes boolean not null default false,
  add column can_animaciones boolean not null default false,
  add column can_usuarios boolean not null default false;

-- Backfill desde el modelo role viejo antes de dropearlo, para no perder
-- acceso de nadie que ya tuviera una fila en admin_users.
update admin_users set
  can_pedidos = true, can_productos = true, can_categorias = true,
  can_ajustes = true, can_animaciones = true, can_usuarios = true
where role = 'full';

update admin_users set
  can_pedidos = true, can_productos = true, can_categorias = true
where role = 'limited';

alter table admin_users drop column role;
