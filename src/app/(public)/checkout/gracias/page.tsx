import { EventAnimation } from "@/components/event-animation/event-animation";
import { getEffectiveEventTheme } from "@/components/event-animation/effective-theme";
import { getThemeMotionSettings, DEFAULT_MOTION_SETTINGS } from "@/lib/theme-settings";

export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const [{ ref }, theme] = await Promise.all([searchParams, getEffectiveEventTheme()]);
  const settings = theme === "none" ? DEFAULT_MOTION_SETTINGS : await getThemeMotionSettings(theme);

  return (
    <>
      <EventAnimation theme={theme} settings={settings} />
      <div className="mx-auto mt-24 max-w-md text-center">
        <h1 className="font-heading text-2xl font-extrabold">¡Gracias por tu compra!</h1>
        <p className="mt-4 text-muted-foreground">
          Tu pago está siendo procesado. Te avisaremos por WhatsApp cuando esté confirmado.
        </p>
        {ref && <p className="mt-2 text-xs text-muted-foreground">Referencia: {ref}</p>}
      </div>
    </>
  );
}
