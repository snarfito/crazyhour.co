"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EventTheme } from "@/lib/event-themes";

export function AnimacionesNav({
  themes,
}: {
  themes: Array<{ theme: Exclude<EventTheme, "none">; label: string }>;
}) {
  const pathname = usePathname();

  return (
    <ul className="mt-6 flex flex-col gap-2">
      {themes.map(({ theme, label }) => {
        const isActive = pathname === `/admin/animaciones/${theme}`;
        return (
          <li key={theme}>
            <Link
              href={`/admin/animaciones/${theme}`}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "block rounded-lg border border-primary bg-primary/5 px-4 py-3 font-semibold text-primary"
                  : "block rounded-lg border border-input px-4 py-3 hover:border-primary"
              }
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
