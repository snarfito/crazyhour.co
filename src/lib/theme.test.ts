import { describe, it, expect } from "vitest";
import { PUBLIC_THEME_CLASS, ADMIN_THEME_CLASS } from "@/lib/theme";

describe("theme constants", () => {
  it("exposes distinct class names for the public and admin themes", () => {
    expect(PUBLIC_THEME_CLASS).toBe("theme-dark");
    expect(ADMIN_THEME_CLASS).toBe("theme-light");
    expect(PUBLIC_THEME_CLASS).not.toBe(ADMIN_THEME_CLASS);
  });
});
