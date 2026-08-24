-- Número de pedido legible, autoincremental, para soporte al cliente.
-- See docs/superpowers/specs/2026-08-24-crazy-hour-order-number-design.md
alter table orders
  add column order_number integer generated always as identity (start with 1001) unique;
