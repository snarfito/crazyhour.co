-- Captura de datos del cliente: correo y dirección de envío.
-- See docs/superpowers/specs/2026-08-23-crazy-hour-customer-data-capture-design.md
-- Nullable on purpose — existing orders have none of this data, and
-- required-ness is enforced in the checkout form, not the database
-- (same pattern as customer_name/customer_phone).
alter table orders
  add column customer_email text,
  add column shipping_address text,
  add column shipping_city text;
