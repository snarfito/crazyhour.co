import { getActiveEventTheme } from "@/lib/settings";
import type { EventTheme } from "@/lib/event-themes";

export async function getEffectiveEventTheme(categoryTheme?: EventTheme | null): Promise<EventTheme> {
  const siteTheme = await getActiveEventTheme();
  return categoryTheme ?? siteTheme;
}
