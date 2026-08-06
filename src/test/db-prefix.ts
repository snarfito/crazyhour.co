/**
 * Every DB-integration test file scopes its fixture rows with a unique
 * prefix and cleans them up via a SQL LIKE pattern. Two rules, both learned
 * the hard way (see git log around 2026-08-05, commits acb0ab6/9f62eb6):
 *
 *  1. SQL LIKE treats "_" and "%" as wildcards, not literal characters —
 *     always build patterns with likePattern(), never `${prefix}%` by hand.
 *  2. No prefix may be a literal string-prefix of another registered
 *     prefix (or of another prefix's slugify()'d form, if your rows go
 *     through slugify() rather than a direct insert — see
 *     categorias/actions.test.ts for why that file's prefix ends in "-",
 *     not "_"). Register yours in REGISTERED_PREFIXES below.
 */
export const REGISTERED_PREFIXES = [
  "zzfase2cat-",
  "zzfase2prod_",
  "zzfase2home_",
  "zzfase2pgcat_",
  "zzfase2pgprod_",
] as const;

export function likePattern(prefix: string): string {
  if (!prefix) throw new Error("empty prefix would build a LIKE pattern matching every row");
  return `${prefix.replace(/([\\%_])/g, "\\$1")}%`;
}
