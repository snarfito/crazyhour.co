import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";

vi.mock("@/lib/supabase/dal", () => ({
  requirePermission: vi.fn().mockResolvedValue({ userId: "test-admin", email: "test@crazyhour.co" }),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("updateSettings (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  const ORIGINAL = {
    whatsapp_number: "",
    contact_email: null as string | null,
    contact_phone: null as string | null,
    active_event_theme: "none",
  };

  beforeEach(async () => {
    await admin.from("settings").update(ORIGINAL).eq("id", true);
  });

  afterEach(async () => {
    await admin.from("settings").update(ORIGINAL).eq("id", true);
  });

  it("updates the singleton settings row", async () => {
    const { updateSettings } = await import("./actions");
    const formData = new FormData();
    formData.set("whatsapp_number", "573001112233");
    formData.set("contact_email", "hola@crazyhour.co");
    formData.set("contact_phone", "3001112233");

    await updateSettings(formData);

    const { data } = await admin.from("settings").select("*").eq("id", true).single();
    expect(data?.whatsapp_number).toBe("573001112233");
    expect(data?.contact_email).toBe("hola@crazyhour.co");
    expect(data?.contact_phone).toBe("3001112233");
  });

  it("stores empty optional fields as null", async () => {
    const { updateSettings } = await import("./actions");
    const formData = new FormData();
    formData.set("whatsapp_number", "573001112233");
    formData.set("contact_email", "");
    formData.set("contact_phone", "");

    await updateSettings(formData);

    const { data } = await admin.from("settings").select("*").eq("id", true).single();
    expect(data?.contact_email).toBeNull();
    expect(data?.contact_phone).toBeNull();
  });

  it("updates the active event theme", async () => {
    const { updateSettings } = await import("./actions");
    const formData = new FormData();
    formData.set("whatsapp_number", "573001112233");
    formData.set("contact_email", "");
    formData.set("contact_phone", "");
    formData.set("active_event_theme", "navidad");

    await updateSettings(formData);

    const { data } = await admin.from("settings").select("*").eq("id", true).single();
    expect(data?.active_event_theme).toBe("navidad");
  });
});
