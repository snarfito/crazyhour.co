import sharp from "sharp";

/** Catalog photos render at most ~800px wide; 1600px keeps 2x-retina sharp without shipping 3 MB PNGs. */
export const MAX_EDGE = 1600;

/** Downscales to MAX_EDGE (never upscales) and re-encodes as WebP — AI-generated PNGs drop from ~3 MB to ~100 KB. */
export function toWebp(bytes: Uint8Array): Promise<Buffer> {
  return sharp(bytes)
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}
