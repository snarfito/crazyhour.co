import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { EventTheme } from "@/lib/event-themes";
import { DEFAULT_MOTION_SETTINGS, type ThemeMotionSettings } from "@/lib/theme-motion-defaults";

export { DEFAULT_MOTION_SETTINGS, type ThemeMotionSettings };

type ThemeSettingsRow = {
  theme: string;
  particle_count: number | null;
  min_duration: number | null;
  max_duration: number | null;
  min_size: number | null;
  max_size: number | null;
  max_opacity: number | null;
  custom_css: string | null;
  shape_image_urls: string[] | null;
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
    shapeImageUrls: row.shape_image_urls ?? [],
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

// Read-modify-write rather than a Postgres array_append/array_remove RPC —
// admin-only, single-user-at-a-time usage, so the race window doesn't
// matter in practice, and this keeps the write path plain Supabase-js.
export async function addThemeShapeImage(theme: Exclude<EventTheme, "none">, url: string): Promise<void> {
  const current = await getThemeMotionSettings(theme);
  const supabase = createServiceClient();
  const { error } = await supabase.from("theme_settings").upsert({
    theme,
    shape_image_urls: [...current.shapeImageUrls, url],
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function removeThemeShapeImage(theme: Exclude<EventTheme, "none">, url: string): Promise<void> {
  const current = await getThemeMotionSettings(theme);
  const supabase = createServiceClient();
  const { error } = await supabase.from("theme_settings").upsert({
    theme,
    shape_image_urls: current.shapeImageUrls.filter((existing) => existing !== url),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
