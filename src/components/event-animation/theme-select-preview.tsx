"use client";

import { useState } from "react";
import { EventAnimation } from "./event-animation";
import type { EventTheme } from "@/lib/event-themes";

export function ThemeSelectPreview({
  id,
  name,
  initialTheme,
  options,
  className,
}: {
  id: string;
  name: string;
  initialTheme: string;
  options: { value: string; label: string }[];
  className: string;
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
        {theme !== "" && <EventAnimation theme={theme as EventTheme} contained />}
      </div>
    </div>
  );
}
