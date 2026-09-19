// One-off: downscale + WebP-encode every catalog image already in Storage (mirrors src/lib/optimize-image.ts).
// Uploads each result to a FRESH path and repoints the DB row — never overwrites a URL that next/image has cached.
// Old objects are left in place (rollback = repoint the row); delete them by hand once the site looks right.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/reencode-catalog.mjs          # dry run
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/reencode-catalog.mjs --apply
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const apply = process.argv.includes("--apply");
const MAX_EDGE = 1600;
const SKIP_BELOW = 400_000; // already small enough
const PREFIX = `${SUPABASE_URL}/storage/v1/object/public/catalog-images/`;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const stamp = Date.now();
let before = 0, after = 0;

async function shrink(url, newPath) {
  if (!url?.startsWith(PREFIX) || url.split("?")[0].endsWith(".webp")) return null; // placeholders, foreign hosts, already done
  // Authenticated API download, not the public URL: public URLs are served via the CDN and count as
  // *Cached* Egress (already over quota on the Free plan); this path counts as regular Egress instead.
  const { data: blob, error: dlError } = await sb.storage.from("catalog-images").download(decodeURIComponent(url.slice(PREFIX.length).split("?")[0]));
  if (dlError) throw dlError;
  const bytes = Buffer.from(await blob.arrayBuffer());
  if (bytes.length < SKIP_BELOW) return null;
  const out = await sharp(bytes).resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  before += bytes.length; after += out.length;
  console.log(`${(bytes.length / 1e6).toFixed(2)} MB -> ${(out.length / 1e3).toFixed(0)} KB  ${newPath}`);
  if (!apply) return null;
  const { error } = await sb.storage.from("catalog-images").upload(newPath, out, { contentType: "image/webp" });
  if (error) throw error;
  return sb.storage.from("catalog-images").getPublicUrl(newPath).data.publicUrl;
}

const { data: images, error: e1 } = await sb.from("product_images").select("id, product_id, original_url, enhanced_url");
if (e1) throw e1;
for (const im of images) {
  const orig = await shrink(im.original_url, `products/${im.product_id}/${im.id}-original-${stamp}.webp`);
  const enh = await shrink(im.enhanced_url, `products/${im.product_id}/${im.id}-enhanced-${stamp}.webp`);
  const patch = { ...(orig && { original_url: orig }), ...(enh && { enhanced_url: enh }) };
  if (Object.keys(patch).length) await sb.from("product_images").update(patch).eq("id", im.id).throwOnError();
}

const { data: cats, error: e2 } = await sb.from("categories").select("id, cover_image_url");
if (e2) throw e2;
for (const c of cats) {
  const url = await shrink(c.cover_image_url, `categories/${c.id}/cover-${stamp}.webp`);
  if (url) await sb.from("categories").update({ cover_image_url: url }).eq("id", c.id).throwOnError();
}

console.log(`\n${apply ? "APPLIED" : "DRY RUN"}: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB`);
