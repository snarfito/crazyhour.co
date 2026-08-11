"use client";

import { useState } from "react";
import { EventAnimation } from "./event-animation";
import { DEFAULT_MOTION_SETTINGS, type ThemeMotionSettings } from "@/lib/theme-settings";
import type { EventTheme } from "@/lib/event-themes";

export function ThemeSelectPreview({
  id,
  name,
  initialTheme,
  options,
  className,
  settingsMap,
}: {
  id: string;
  name: string;
  initialTheme: string;
  options: { value: string; label: string }[];
  className: string;
  settingsMap: Record<Exclude<EventTheme, "none">, ThemeMotionSettings>;
}) {
  const [theme, setTheme] = useState(initialTheme);

  return (
    <div className="flex flex-col gap-2">
      <select
        id={id}
        name={name}
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className={className}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="relative h-32 w-full overflow-hidden rounded-lg border border-input bg-background">
        {theme !== "" && theme !== "none" && (
          <EventAnimation
            theme={theme as EventTheme}
            contained
            settings={settingsMap[theme as Exclude<EventTheme, "none">] ?? DEFAULT_MOTION_SETTINGS}
          />
        )}
      </div>
    </div>
  );
}
