import { getActiveEventTheme } from "@/lib/settings";
import { EventAnimation } from "./event-animation";
import type { EventTheme } from "@/lib/event-themes";

export async function RouteEventAnimation({
  categoryTheme,
}: {
  categoryTheme?: EventTheme | null;
}) {
  const siteTheme = await getActiveEventTheme();
  const theme = categoryTheme ?? siteTheme;
  return <EventAnimation theme={theme} />;
}
