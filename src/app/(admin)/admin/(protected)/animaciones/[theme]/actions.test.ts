import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";

// theme-settings.ts imports "server-only", which throws when loaded outside
// a real Next.js server render (same fix as settings.test.ts).
vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/dal", () => ({
  requirePermission: vi.fn().mockResolvedValue({ userId: "test-admin", email: "test@crazyhour.co" }),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Uses "baby_shower" — disjoint from theme-settings.test.ts's "carnaval"/
// "velitas" and [categorySlug]/page.test.tsx's "grados", since theme_settings
// rows can't be prefix-isolated (fixed enum of real theme names) and Vitest
// runs files in parallel against the same local Supabase.
describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("updateThemeSettingsAction (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    await admin.from("theme_settings").delete().eq("theme", "baby_shower");
  });

  afterEach(async () => {
    await admin.from("theme_settings").delete().eq("theme", "baby_shower");
  });

  it("saves valid values within range", async () => {
    const { updateThemeSettingsAction } = await import("./actions");
    const formData = new FormData();
    formData.set("particle_count", "20");
    formData.set("min_duration", "10");
    formData.set("max_duration", "18");
    formData.set("min_size", "20");
    formData.set("max_size", "30");
    formData.set("max_opacity", "0.4");
    formData.set("custom_css", "");

    await updateThemeSettingsAction("baby_shower", formData);

    const { data } = await admin.from("theme_settings").select("*").eq("theme", "baby_shower").single();
    expect(data?.particle_count).toBe(20);
    expect(data?.max_opacity).toBe(0.4);
    expect(data?.custom_css).toBeNull();
  });

  it("rejects a particle_count outside 1-30", async () => {
    const { updateThemeSettingsAction } = await import("./actions");
    const formData = new FormData();
    formData.set("particle_count", "500");
    formData.set("min_duration", "10");
    formData.set("max_duration", "18");
    formData.set("min_size", "20");
    formData.set("max_size", "30");
    formData.set("max_opacity", "0.4");
    formData.set("custom_css", "");

    await expect(updateThemeSettingsAction("baby_shower", formData)).rejects.toThrow(/particle_count/i);
  });

  it("rejects an opacity outside 0-1", async () => {
    const { updateThemeSettingsAction } = await import("./actions");
    const formData = new FormData();
    formData.set("particle_count", "10");
    formData.set("min_duration", "10");
    formData.set("max_duration", "18");
    formData.set("min_size", "20");
    formData.set("max_size", "30");
    formData.set("max_opacity", "2");
    formData.set("custom_css", "");

    await expect(updateThemeSettingsAction("baby_shower", formData)).rejects.toThrow(/max_opacity/i);
  });

  it("stores an empty custom_css field as null", async () => {
    const { updateThemeSettingsAction } = await import("./actions");
    const formData = new FormData();
    formData.set("particle_count", "10");
    formData.set("min_duration", "10");
    formData.set("max_duration", "18");
    formData.set("min_size", "20");
    formData.set("max_size", "30");
    formData.set("max_opacity", "0.2");
    formData.set("custom_css", "  ");

    await updateThemeSettingsAction("baby_shower", formData);

    const { data } = await admin.from("theme_settings").select("custom_css").eq("theme", "baby_shower").single();
    expect(data?.custom_css).toBeNull();
  });
});
