import { slugify } from "./slug";

/**
 * Empareja el nombre de un archivo subido (ej. "chrome-gold.jpg") con la
 * opción de variante cuyo nombre coincide — pensado para subir muchas fotos
 * de una vez cuando el proveedor ya las nombra por color/talla. Exact match
 * primero; si no, la opción más larga cuyo slug esté contenido en el
 * nombre del archivo (o viceversa), para evitar falsos positivos cortos
 * como "Gold" emparejando con "Chrome Gold Renombrado".
 */
export function matchOptionByFilename<T extends { displayName: string }>(filename: string, options: T[]): T | null {
  // slugify() drops "_" outright instead of treating it as a word
  // separator, so "Chrome_Silver.png" would otherwise slugify to
  // "chromesilver" and miss "Chrome Silver" — normalize it to a space first.
  const withoutExtension = filename.replace(/\.[^./]+$/, "").replace(/_/g, " ");
  const targetSlug = slugify(withoutExtension);
  if (!targetSlug) return null;

  const exact = options.find((o) => slugify(o.displayName) === targetSlug);
  if (exact) return exact;

  const candidates = options
    .map((option) => ({ option, slug: slugify(option.displayName) }))
    .filter(({ slug }) => slug.length >= 3 && (targetSlug.includes(slug) || slug.includes(targetSlug)));
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.slug.length - a.slug.length);
  return candidates[0].option;
}
