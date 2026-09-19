// Deletes PNG/JPEG objects under products/ and categories/ that NO database row points to any more
// (i.e. the originals left behind by scripts/reencode-catalog.mjs). Anything still referenced is never touched.
// Deleting is irreversible — that's why this waits weeks after the re-encode. Dry run by default.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/delete-old-catalog-images.mjs          # list only
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/delete-old-catalog-images.mjs --apply
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const apply = process.argv.includes("--apply");
const PREFIX = `${SUPABASE_URL}/storage/v1/object/public/catalog-images/`;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const bucket = sb.storage.from("catalog-images");

const toPath = (url) => (url?.startsWith(PREFIX) ? decodeURIComponent(url.slice(PREFIX.length).split("?")[0]) : null);

const referenced = new Set();
const { data: images } = await sb.from("product_images").select("original_url, enhanced_url").throwOnError();
for (const r of images) [r.original_url, r.enhanced_url].forEach((u) => referenced.add(toPath(u)));
const { data: cats } = await sb.from("categories").select("cover_image_url").throwOnError();
for (const c of cats) referenced.add(toPath(c.cover_image_url));

async function walk(prefix, out) {
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await bucket.list(prefix, { limit: 1000, offset });
    if (error) throw error;
    for (const o of data) {
      if (o.id === null) await walk(`${prefix}${o.name}/`, out); // folder
      else out.push({ path: prefix + o.name, size: o.metadata?.size ?? 0 });
    }
    if (data.length < 1000) return;
  }
}

const all = [];
for (const top of ["products/", "categories/"]) await walk(top, all);
const doomed = all.filter((f) => /\.(png|jpe?g)$/i.test(f.path) && !referenced.has(f.path));
const bytes = doomed.reduce((n, f) => n + f.size, 0);

for (const f of doomed) console.log(`${(f.size / 1e6).toFixed(2)} MB  ${f.path}`);
console.log(`\n${apply ? "DELETING" : "DRY RUN"}: ${doomed.length} unreferenced png/jpeg files, ${(bytes / 1e6).toFixed(1)} MB (of ${all.length} files scanned, ${referenced.size} referenced)`);

if (apply) {
  for (let i = 0; i < doomed.length; i += 100) {
    const { error } = await bucket.remove(doomed.slice(i, i + 100).map((f) => f.path));
    if (error) throw error;
  }
  console.log("Done.");
}
