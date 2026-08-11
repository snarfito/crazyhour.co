import { Snowflake, Heart, Ghost, Cat, PartyPopper, Sparkles, type LucideIcon } from "lucide-react";

export const EVENT_THEMES = ["none", "navidad", "amor_y_amistad", "halloween", "hora_loca"] as const;
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
};
