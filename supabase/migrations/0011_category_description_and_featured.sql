-- Two additive columns for the "page essentials" redesign
-- (docs/superpowers/specs/2026-08-12-crazy-hour-page-essentials-redesign-design.md):
--  - description: short copy shown on the category page header.
--  - is_featured: admin toggle picking which category (if any) gets the
--    homepage "featured strip". No uniqueness constraint — if more than one
--    row is ever flagged true, the home page query just takes the first by
--    sort_order (see Task 8). No new GRANT/policy needed: categories already
--    has table-wide grants and `using (true)` RLS policies from 0002/0004,
--    which cover new columns automatically.
alter table categories add column description text;
alter table categories add column is_featured boolean not null default false;
