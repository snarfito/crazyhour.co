import { describe, it, expect } from "vitest";
import { EVENT_THEMES, isValidEventTheme, EVENT_THEME_REGISTRY, buildThemeOptions } from "./event-themes";

describe("isValidEventTheme", () => {
  it("accepts every value in EVENT_THEMES", () => {
    for (const theme of EVENT_THEMES) {
      expect(isValidEventTheme(theme)).toBe(true);
    }
  });

  it.each([undefined, null, "", "halloween2", "Halloween", "0", 5, {}])(
    "rejects invalid value %p",
    (value) => {
      expect(isValidEventTheme(value)).toBe(false);
    },
  );
});

describe("EVENT_THEME_REGISTRY", () => {
  it("has a config for every non-none theme, with at least one shape and one color", () => {
    for (const theme of EVENT_THEMES) {
      if (theme === "none") continue;
      const config = EVENT_THEME_REGISTRY[theme];
      expect(config.label).toBeTruthy();
      expect(config.shapes.length).toBeGreaterThan(0);
      expect(config.colors.length).toBeGreaterThan(0);
      expect(["up", "down"]).toContain(config.direction);
    }
  });
});

describe("buildThemeOptions", () => {
  it("without inherit: Ninguno first, then all 12 themes in registry order", () => {
    const options = buildThemeOptions(false);
    expect(options[0]).toEqual({ value: "none", label: "Ninguno" });
    expect(options).toHaveLength(13);
    expect(options[1]).toEqual({ value: "navidad", label: "Navidad" });
  });

  it("with inherit: 'Usar tema del sitio' first, then Ninguno, then all 12 themes", () => {
    const options = buildThemeOptions(true);
    expect(options[0]).toEqual({ value: "", label: "Usar tema del sitio" });
    expect(options[1]).toEqual({ value: "none", label: "Ninguno" });
    expect(options).toHaveLength(14);
  });
});
