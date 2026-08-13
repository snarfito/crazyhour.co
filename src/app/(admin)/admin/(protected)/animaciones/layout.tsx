import Link from "next/link";
import { requireFullAdmin } from "@/lib/supabase/dal";
import { EVENT_THEME_REGISTRY, type EventTheme } from "@/lib/event-themes";

export default async function AnimacionesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireFullAdmin();
  const themes = Object.keys(EVENT_THEME_REGISTRY) as Array<Exclude<EventTheme, "none">>;

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="shrink-0 sm:w-56">
        <h1 className="font-heading text-2xl font-extrabold">Animaciones</h1>
        <ul className="mt-6 flex flex-col gap-2">
          {themes.map((theme) => (
            <li key={theme}>
              <Link
                href={`/admin/animaciones/${theme}`}
                className="block rounded-lg border border-input px-4 py-3 hover:border-primary"
              >
                {EVENT_THEME_REGISTRY[theme].label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
