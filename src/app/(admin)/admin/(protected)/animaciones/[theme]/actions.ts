"use server";

import { revalidatePath } from "next/cache";
import { requireFullAdmin } from "@/lib/supabase/dal";
import { updateThemeMotionSettings } from "@/lib/theme-settings";
import type { EventTheme } from "@/lib/event-themes";

function readNumber(formData: FormData, field: string, min: number, max: number): number {
  const value = Number(formData.get(field));
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${field} debe estar entre ${min} y ${max}.`);
  }
  return value;
}

export async function updateThemeSettingsAction(theme: Exclude<EventTheme, "none">, formData: FormData) {
  await requireFullAdmin();

  const particleCount = readNumber(formData, "particle_count", 1, 30);
  const minDuration = readNumber(formData, "min_duration", 4, 40);
  const maxDuration = readNumber(formData, "max_duration", 4, 40);
  const minSize = readNumber(formData, "min_size", 8, 64);
  const maxSize = readNumber(formData, "max_size", 8, 64);
  const maxOpacity = readNumber(formData, "max_opacity", 0, 1);
  const customCss = String(formData.get("custom_css") ?? "").trim() || null;

  await updateThemeMotionSettings(theme, {
    particleCount,
    minDuration,
    maxDuration,
    minSize,
    maxSize,
    maxOpacity,
    customCss,
  });

  revalidatePath(`/admin/animaciones/${theme}`);
}
