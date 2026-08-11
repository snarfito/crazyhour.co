import { EventAnimation } from "@/components/event-animation/event-animation";
import { getEffectiveEventTheme } from "@/components/event-animation/effective-theme";
import { getThemeMotionSettings, DEFAULT_MOTION_SETTINGS } from "@/lib/theme-settings";
import { CheckoutPageClient } from "./checkout-page-client";

// See carrito/page.tsx for why this is needed — getEffectiveEventTheme()
// gives Next no dynamic-API signal on its own, so this page would otherwise
// prerender as static and never pick up a later admin theme change.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const theme = await getEffectiveEventTheme();
  const settings = theme === "none" ? DEFAULT_MOTION_SETTINGS : await getThemeMotionSettings(theme);

  return (
    <>
      <EventAnimation theme={theme} settings={settings} />
      <CheckoutPageClient />
    </>
  );
}
