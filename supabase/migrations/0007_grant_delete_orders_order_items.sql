-- Fase 3 Task 12: fix a gap left by 0006 — that migration granted
-- select/insert/update on orders and select/insert on order_items to
-- service_role, but never DELETE on either. Same lesson as 0004/0005's
-- comments: service_role needs an explicit GRANT per privilege even though
-- BYPASSRLS skips policy evaluation, it doesn't skip table-level GRANT
-- checks. Discovered because actions.test.ts's beforeEach cleans up
-- previous fixture rows with `.delete()` on orders (which needs to cascade
-- to order_items via the FK's ON DELETE CASCADE — that cascade action also
-- requires DELETE privilege on order_items for the deleting role) — this
-- failed with `permission denied for table orders` before this migration.
grant delete on orders to service_role;
grant delete on order_items to service_role;
