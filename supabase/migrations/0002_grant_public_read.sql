-- Grant table-level SELECT to the PostgREST roles for the tables that should
-- be publicly readable. RLS policies (0001) filter rows; without this GRANT,
-- PostgREST returns "permission denied" before RLS is even evaluated, because
-- this project has "Automatically expose new tables" disabled (deliberate —
-- explicit grants only, no table exposed by default).
--
-- orders and order_items intentionally get NO grant here: anon/authenticated
-- have zero table-level access, matching the default-deny design in 0001.
-- All order writes/reads go through server-side code using the service_role
-- key, which bypasses both grants and RLS.

grant select on categories to anon, authenticated;
grant select on products to anon, authenticated;
grant select on product_images to anon, authenticated;
