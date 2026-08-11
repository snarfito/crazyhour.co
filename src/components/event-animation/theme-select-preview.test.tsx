import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSelectPreview } from "./theme-select-preview";
import { DEFAULT_MOTION_SETTINGS, type ThemeMotionSettings } from "@/lib/theme-motion-defaults";
import type { EventTheme } from "@/lib/event-themes";

const OPTIONS = [
  { value: "none", label: "Ninguno" },
  { value: "navidad", label: "Navidad" },
  { value: "carnaval", label: "Carnaval" },
];

// Intentionally partial — the component falls back to DEFAULT_MOTION_SETTINGS
// for any theme key not present in the map, so these tests only need entries
// for the themes they actually select.
const SETTINGS_MAP = {
  navidad: DEFAULT_MOTION_SETTINGS,
  carnaval: { ...DEFAULT_MOTION_SETTINGS, particleCount: 20 },
} as Record<Exclude<EventTheme, "none">, ThemeMotionSettings>;

describe("ThemeSelectPreview", () => {
  it("renders no particles in the preview box when the initial theme is none", () => {
    const { container } = render(
      <ThemeSelectPreview id="t" name="t" initialTheme="none" options={OPTIONS} className="" settingsMap={SETTINGS_MAP} />,
    );
    expect(container.querySelectorAll(".event-particle")).toHaveLength(0);
  });

  it("updates the preview immediately when a new option is picked, without any submit", async () => {
    render(<ThemeSelectPreview id="t" name="t" initialTheme="none" options={OPTIONS} className="" settingsMap={SETTINGS_MAP} />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;

    await userEvent.selectOptions(select, "navidad");

    expect(select.value).toBe("navidad");
    expect(document.querySelectorAll(".event-particle").length).toBeGreaterThan(0);
  });

  it("renders nothing in the preview box for the empty-string 'inherit' value", () => {
    const { container } = render(
      <ThemeSelectPreview
        id="t"
        name="t"
        initialTheme=""
        options={[{ value: "", label: "Usar tema del sitio" }, ...OPTIONS]}
        className=""
        settingsMap={SETTINGS_MAP}
      />,
    );
    expect(container.querySelectorAll(".event-particle")).toHaveLength(0);
  });

  it("uses the selected theme's own settings for the preview, not the defaults", async () => {
    render(
      <ThemeSelectPreview id="t" name="t" initialTheme="none" options={OPTIONS} className="" settingsMap={SETTINGS_MAP} />,
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;

    await userEvent.selectOptions(select, "carnaval");

    expect(document.querySelectorAll(".event-particle")).toHaveLength(20);
  });
});
