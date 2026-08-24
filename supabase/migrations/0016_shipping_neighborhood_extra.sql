-- Barrio e información adicional (apto/casa/torre) de envío.
-- Nullable on purpose — same pattern as 0015: required-ness is enforced
-- in the checkout form, not the database.
alter table orders
  add column shipping_neighborhood text,
  add column shipping_extra text;
