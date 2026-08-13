import { requireFullAdmin } from "@/lib/supabase/dal";
import { EVENT_THEME_REGISTRY, type EventTheme } from "@/lib/event-themes";
import { AnimacionesNav } from "./animaciones-nav";

export default async function AnimacionesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireFullAdmin();
  const themes = (Object.keys(EVENT_THEME_REGISTRY) as Array<Exclude<EventTheme, "none">>).map(
    (theme) => ({ theme, label: EVENT_THEME_REGISTRY[theme].label }),
  );

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="shrink-0 sm:w-56">
        <h1 className="font-heading text-2xl font-extrabold">Animaciones</h1>
        <AnimacionesNav themes={themes} />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
