-- Estado intermedio de alistamiento + datos de envío (transportadora, guía).
-- See docs/superpowers/specs/2026-08-23-crazy-hour-fulfillment-status-design.md
alter type order_status add value 'alistando' after 'paid';

alter table orders
  add column tracking_number text,
  add column shipping_carrier text;
