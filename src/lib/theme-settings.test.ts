import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

// theme_settings rows are keyed by real theme names, not a per-file test
// prefix (unlike categories/products) — without an afterEach too, a row
// this file leaves behind for "carnaval"/"velitas"/"dia_padre" can leak into
// any other test file that exercises those same theme keys against local
// Supabase. "dia_padre" is this file's third, for the shape-image tests.
describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("theme-settings (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    await admin.from("theme_settings").delete().in("theme", ["carnaval", "velitas", "dia_padre"]);
  });

  afterEach(async () => {
    await admin.from("theme_settings").delete().in("theme", ["carnaval", "velitas", "dia_padre"]);
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

  it("addThemeShapeImage appends a URL, creating the row if none exists", async () => {
    const { addThemeShapeImage, getThemeMotionSettings } = await import("./theme-settings");

    await addThemeShapeImage("dia_padre", "https://example.com/shape1.png");
    const settings = await getThemeMotionSettings("dia_padre");

    expect(settings.shapeImageUrls).toEqual(["https://example.com/shape1.png"]);
  });

  it("addThemeShapeImage appends to an existing list without dropping other fields", async () => {
    const { updateThemeMotionSettings, addThemeShapeImage, getThemeMotionSettings } = await import(
      "./theme-settings"
    );

    await updateThemeMotionSettings("dia_padre", { particleCount: 15 });
    await addThemeShapeImage("dia_padre", "https://example.com/shape1.png");
    await addThemeShapeImage("dia_padre", "https://example.com/shape2.png");
    const settings = await getThemeMotionSettings("dia_padre");

    expect(settings.shapeImageUrls).toEqual([
      "https://example.com/shape1.png",
      "https://example.com/shape2.png",
    ]);
    expect(settings.particleCount).toBe(15);
  });

  it("removeThemeShapeImage drops just the matching URL", async () => {
    const { addThemeShapeImage, removeThemeShapeImage, getThemeMotionSettings } = await import(
      "./theme-settings"
    );

    await addThemeShapeImage("dia_padre", "https://example.com/shape1.png");
    await addThemeShapeImage("dia_padre", "https://example.com/shape2.png");
    await removeThemeShapeImage("dia_padre", "https://example.com/shape1.png");
    const settings = await getThemeMotionSettings("dia_padre");

    expect(settings.shapeImageUrls).toEqual(["https://example.com/shape2.png"]);
  });
});
