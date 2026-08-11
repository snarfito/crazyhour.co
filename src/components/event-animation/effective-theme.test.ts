import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/settings", () => ({
  getActiveEventTheme: vi.fn().mockResolvedValue("navidad"),
}));

describe("getEffectiveEventTheme", () => {
  it("uses the site-wide theme when no categoryTheme is given", async () => {
    const { getEffectiveEventTheme } = await import("./effective-theme");
    expect(await getEffectiveEventTheme()).toBe("navidad");
  });

  it("uses the site-wide theme when categoryTheme is null (no override assigned)", async () => {
    const { getEffectiveEventTheme } = await import("./effective-theme");
    expect(await getEffectiveEventTheme(null)).toBe("navidad");
  });

  it("returns 'none' when categoryTheme is explicitly 'none', even though a site-wide theme is active", async () => {
    const { getEffectiveEventTheme } = await import("./effective-theme");
    expect(await getEffectiveEventTheme("none")).toBe("none");
  });

  it("uses categoryTheme over the site-wide theme when both are set", async () => {
    const { getEffectiveEventTheme } = await import("./effective-theme");
    expect(await getEffectiveEventTheme("carnaval")).toBe("carnaval");
  });
});
