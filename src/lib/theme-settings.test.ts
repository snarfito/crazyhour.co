import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("theme-settings (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    await admin.from("theme_settings").delete().in("theme", ["carnaval", "velitas"]);
  });

  it("getThemeMotionSettings returns full defaults when no row exists", async () => {
    const { getThemeMotionSettings, DEFAULT_MOTION_SETTINGS } = await import("./theme-settings");
    expect(await getThemeMotionSettings("carnaval")).toEqual(DEFAULT_MOTION_SETTINGS);
  });

  it("getThemeMotionSettings merges a partial row over defaults field by field", async () => {
    await admin.from("theme_settings").insert({ theme: "carnaval", particle_count: 20 });
    const { getThemeMotionSettings, DEFAULT_MOTION_SETTINGS } = await import("./theme-settings");

    const settings = await getThemeMotionSettings("carnaval");
    expect(settings.particleCount).toBe(20);
    expect(settings.minDuration).toBe(DEFAULT_MOTION_SETTINGS.minDuration);
    expect(settings.customCss).toBeNull();
  });

  it("getAllThemeMotionSettings returns all 12 theme keys, even with no rows at all", async () => {
    const { getAllThemeMotionSettings, DEFAULT_MOTION_SETTINGS } = await import("./theme-settings");
    const all = await getAllThemeMotionSettings();

    expect(Object.keys(all)).toHaveLength(12);
    expect(all.velitas).toEqual(DEFAULT_MOTION_SETTINGS);
  });

  it("updateThemeMotionSettings upserts and getThemeMotionSettings reflects it", async () => {
    const { updateThemeMotionSettings, getThemeMotionSettings } = await import("./theme-settings");

    await updateThemeMotionSettings("velitas", { particleCount: 12, maxOpacity: 0.3 });
    const settings = await getThemeMotionSettings("velitas");

    expect(settings.particleCount).toBe(12);
    expect(settings.maxOpacity).toBe(0.3);
  });
});
