function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Palabras de acabado que los proveedores anteponen al color real (globos
// cromados/metalizados/perlados) — se quitan antes de buscar, porque el
// color de fondo real no cambia por el acabado (aunque el acabado sí hace
// que una foto le gane por completo a un círculo de color, ver PriceFields).
const MODIFIER_WORDS = new Set([
  "chrome", "cromado", "cromada",
  "metalizado", "metalizada", "metalico", "metallic",
  "perlado", "perlada", "pearl",
  "mate", "matte",
  "solido", "solida", "solid",
  "nuevo", "nueva", "new",
]);

// Nombres compuestos reales del catálogo de mayoristas — se buscan ANTES de
// quitar modificadores, para no perder matices como "rose gold" ≠ "gold".
const COMPOUND_COLORS: Record<string, string> = {
  "rose gold": "#B76E79",
  "rose red": "#C21E56",
  "night blue": "#16215B",
  "new blue": "#2962FF",
  "light blue": "#64B5F6",
  "light green": "#90C978",
  "light pink": "#F8BBD0",
  "dark green": "#1B5E20",
  "dark gold": "#A67C00",
  "sand gold": "#C9A66B",
  "sand white": "#F5F0E1",
  "wine red": "#722F37",
  "lemon yellow": "#FFF44F",
  "soft pink": "#F4C2C2",
  "retro pink": "#D98695",
  "retro blue": "#7EA8BE",
  "olive green": "#708238",
  "peacock blue": "#005F6A",
  "dust purple": "#9B8AA0",
};

const BASE_COLORS: Record<string, string> = {
  // Español
  rojo: "#E53935",
  naranja: "#FB8C00",
  amarillo: "#FDD835",
  verde: "#43A047",
  azul: "#1E88E5",
  morado: "#8E24AA",
  violeta: "#8E24AA",
  purpura: "#8E24AA",
  rosa: "#EC407A",
  rosado: "#EC407A",
  negro: "#212121",
  blanco: "#FAFAFA",
  gris: "#9E9E9E",
  marron: "#6D4C41",
  cafe: "#4E342E",
  cacao: "#4E342E",
  dorado: "#D4AF37",
  oro: "#D4AF37",
  plateado: "#C0C0C0",
  plata: "#C0C0C0",
  beige: "#E8DCC8",
  crema: "#E8DCC8",
  transparente: "#FFFFFF",
  granate: "#6E1423",
  caqui: "#C3B091",
  durazno: "#FFCBA4",
  piel: "#E8B48C",
  // English
  red: "#E53935",
  orange: "#FB8C00",
  yellow: "#FDD835",
  green: "#43A047",
  blue: "#1E88E5",
  purple: "#8E24AA",
  pink: "#EC407A",
  black: "#212121",
  white: "#FAFAFA",
  gray: "#9E9E9E",
  grey: "#9E9E9E",
  brown: "#6D4C41",
  coffee: "#4E342E",
  gold: "#D4AF37",
  silver: "#C0C0C0",
  transparent: "#FFFFFF",
  garnet: "#6E1423",
  khaki: "#C3B091",
  peach: "#FFCBA4",
  skin: "#E8B48C",
  tiffany: "#0ABAB5",
  avocado: "#7A8B4F",
  wisteria: "#C9A0DC",
  champagne: "#F7E7CE",
};

/**
 * Sugerencia best-effort de hex a partir del nombre de un color de
 * mayorista (ej. "Chrome Gold" → #D4AF37) — NUNCA reemplaza una foto real
 * para acabados cromados/metalizados/perlados, solo da un punto de partida
 * editable en el selector de color. null cuando no hay match razonable.
 */
export function suggestColorHex(rawName: string): string | null {
  const normalized = normalize(rawName);
  if (!normalized) return null;

  if (COMPOUND_COLORS[normalized]) return COMPOUND_COLORS[normalized];
  if (BASE_COLORS[normalized]) return BASE_COLORS[normalized];

  const words = normalized.split(" ").filter((w) => !MODIFIER_WORDS.has(w));
  const stripped = words.join(" ");
  if (stripped && stripped !== normalized) {
    if (COMPOUND_COLORS[stripped]) return COMPOUND_COLORS[stripped];
    if (BASE_COLORS[stripped]) return BASE_COLORS[stripped];
  }

  const lastWord = words[words.length - 1];
  if (lastWord && BASE_COLORS[lastWord]) return BASE_COLORS[lastWord];

  return null;
}
