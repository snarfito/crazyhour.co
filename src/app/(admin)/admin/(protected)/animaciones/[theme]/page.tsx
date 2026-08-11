import { notFound } from "next/navigation";
import { isValidEventTheme, type EventTheme } from "@/lib/event-themes";
import { getThemeMotionSettings } from "@/lib/theme-settings";
import { ThemeEditorClient } from "./theme-editor-client";

export default async function AnimacionEditorPage({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const { theme } = await params;

  if (!isValidEventTheme(theme) || theme === "none") notFound();

  const validTheme = theme as Exclude<EventTheme, "none">;
  const settings = await getThemeMotionSettings(validTheme);

  return <ThemeEditorClient theme={validTheme} initial={settings} />;
}
