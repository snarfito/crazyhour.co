import {
  Snowflake, Heart, Ghost, Cat, PartyPopper, Sparkles,
  Flame, Drama, Flower, Flower2, Shirt, HatGlasses,
  Ribbon, GraduationCap, ScrollText, Bird, Baby, Droplet,
  type LucideIcon,
} from "lucide-react";

export const EVENT_THEMES = [
  "none", "navidad", "amor_y_amistad", "halloween", "hora_loca",
  "velitas", "carnaval", "dia_madre", "dia_padre",
  "fiestas_patrias", "grados", "primeras_comuniones", "baby_shower",
] as const;
export type EventTheme = (typeof EVENT_THEMES)[number];

export function isValidEventTheme(value: unknown): value is EventTheme {
  return typeof value === "string" && (EVENT_THEMES as readonly string[]).includes(value);
}

export type ThemeConfig = {
  label: string;
  shapes: LucideIcon[];
  colors: string[];
  direction: "up" | "down";
};

export const EVENT_THEME_REGISTRY: Record<Exclude<EventTheme, "none">, ThemeConfig> = {
  navidad: {
    label: "Navidad",
    shapes: [Snowflake],
    colors: ["#FFFFFF", "#C7D6EA"],
    direction: "down",
  },
  amor_y_amistad: {
    label: "Amor y Amistad",
    shapes: [Heart],
    colors: ["#E8280A", "#FC6000"],
    direction: "up",
  },
  halloween: {
    label: "Halloween",
    shapes: [Ghost, Cat],
    colors: ["#FC6000", "#C7D6EA"],
    direction: "down",
  },
  hora_loca: {
    label: "Hora Loca",
    shapes: [PartyPopper, Sparkles],
    colors: ["#FFC400", "#4FB3F0", "#E8280A"],
    direction: "down",
  },
  velitas: {
    label: "Velitas",
    shapes: [Flame, Sparkles],
    colors: ["#FC6000", "#FFC400"],
    direction: "up",
  },
  carnaval: {
    label: "Carnaval",
    shapes: [Drama, Sparkles],
    colors: ["#FC6000", "#FFC400", "#4FB3F0", "#7CB800"],
    direction: "down",
  },
  dia_madre: {
    label: "Día de la Madre",
    shapes: [Flower, Flower2],
    colors: ["#F7C5D8", "#E9E4F0"],
    direction: "down",
  },
  dia_padre: {
    label: "Día del Padre",
    shapes: [Shirt, HatGlasses],
    colors: ["#102A49", "#FFC400"],
    direction: "down",
  },
  fiestas_patrias: {
    label: "Fiestas Patrias",
    shapes: [Ribbon, PartyPopper],
    colors: ["#FCD116", "#003893", "#CE1126"],
    direction: "down",
  },
  grados: {
    label: "Grados",
    shapes: [GraduationCap, ScrollText],
    colors: ["#102A49", "#FFC400"],
    direction: "down",
  },
  primeras_comuniones: {
    label: "Primeras Comuniones",
    shapes: [Bird, Sparkles],
    colors: ["#FFFFFF", "#FFC400"],
    direction: "down",
  },
  baby_shower: {
    label: "Baby Shower",
    shapes: [Baby, Droplet],
    colors: ["#F7C5D8", "#4FB3F0"],
    direction: "up",
  },
};

export function buildThemeOptions(includeInherit: boolean): { value: string; label: string }[] {
  const themeOptions = Object.entries(EVENT_THEME_REGISTRY).map(([value, config]) => ({
    value,
    label: config.label,
  }));
  const noneOption = { value: "none", label: "Ninguno" };
  return includeInherit
    ? [{ value: "", label: "Usar tema del sitio" }, noneOption, ...themeOptions]
    : [noneOption, ...themeOptions];
}
