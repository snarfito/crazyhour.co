import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { EventTheme } from "@/lib/event-themes";

export type ThemeMotionSettings = {
  particleCount: number;
  minDuration: number;
  maxDuration: number;
  minSize: number;
  maxSize: number;
  maxOpacity: number;
  customCss: string | null;
};

export const DEFAULT_MOTION_SETTINGS: ThemeMotionSettings = {
  particleCount: 8,
  minDuration: 14,
  maxDuration: 22,
  minSize: 16,
  maxSize: 28,
  maxOpacity: 0.18,
  customCss: null,
};

type ThemeSettingsRow = {
  theme: string;
  particle_count: number | null;
  min_duration: number | null;
  max_duration: number | null;
  min_size: number | null;
  max_size: number | null;
  max_opacity: number | null;
  custom_css: string | null;
};

function mergeRow(row: ThemeSettingsRow | null | undefined): ThemeMotionSettings {
  if (!row) return { ...DEFAULT_MOTION_SETTINGS };
  return {
    particleCount: row.particle_count ?? DEFAULT_MOTION_SETTINGS.particleCount,
    minDuration: row.min_duration ?? DEFAULT_MOTION_SETTINGS.minDuration,
    maxDuration: row.max_duration ?? DEFAULT_MOTION_SETTINGS.maxDuration,
    minSize: row.min_size ?? DEFAULT_MOTION_SETTINGS.minSize,
    maxSize: row.max_size ?? DEFAULT_MOTION_SETTINGS.maxSize,
    maxOpacity: row.max_opacity ?? DEFAULT_MOTION_SETTINGS.maxOpacity,
    customCss: row.custom_css ?? null,
  };
}

export async function getThemeMotionSettings(
  theme: Exclude<EventTheme, "none">,
): Promise<ThemeMotionSettings> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("theme_settings").select("*").eq("theme", theme).maybeSingle();
  return mergeRow(data);
}

export async function getAllThemeMotionSettings(): Promise<
  Record<Exclude<EventTheme, "none">, ThemeMotionSettings>
> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("theme_settings").select("*");
  const rowsByTheme = new Map((data ?? []).map((row) => [row.theme, row as ThemeSettingsRow]));

  const themes: Exclude<EventTheme, "none">[] = [
    "navidad", "amor_y_amistad", "halloween", "hora_loca",
    "velitas", "carnaval", "dia_madre", "dia_padre",
    "fiestas_patrias", "grados", "primeras_comuniones", "baby_shower",
  ];

  return Object.fromEntries(
    themes.map((theme) => [theme, mergeRow(rowsByTheme.get(theme))]),
  ) as Record<Exclude<EventTheme, "none">, ThemeMotionSettings>;
}

export async function updateThemeMotionSettings(
  theme: Exclude<EventTheme, "none">,
  values: Partial<ThemeMotionSettings>,
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("theme_settings").upsert({
    theme,
    ...(values.particleCount !== undefined && { particle_count: values.particleCount }),
    ...(values.minDuration !== undefined && { min_duration: values.minDuration }),
    ...(values.maxDuration !== undefined && { max_duration: values.maxDuration }),
    ...(values.minSize !== undefined && { min_size: values.minSize }),
    ...(values.maxSize !== undefined && { max_size: values.maxSize }),
    ...(values.maxOpacity !== undefined && { max_opacity: values.maxOpacity }),
    ...(values.customCss !== undefined && { custom_css: values.customCss }),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
