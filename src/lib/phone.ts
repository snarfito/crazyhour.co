export function isValidCOPhone(raw: string): boolean {
  const digits = raw.replace(/[^\d]/g, "").replace(/^57/, "");
  return /^3\d{9}$/.test(digits);
}
