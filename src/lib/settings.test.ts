import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";

// settings.ts imports "server-only", which throws when loaded outside a
// real Next.js server render (same fix as dal.test.ts/enhance.test.ts).
vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("settings (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    // settings is a singleton row (see 0006) — reset it to a known state
    // before each test instead of the delete/insert fixture pattern used
    // for multi-row tables.
    await admin
      .from("settings")
      .update({
        whatsapp_number: "573000000000",
        contact_email: "hola@crazyhour.co",
        contact_phone: "3000000000",
        active_event_theme: "none",
      })
      .eq("id", true);
  });

  it("getSettings returns the current row, camelCased", async () => {
    const { getSettings } = await import("./settings");

    const settings = await getSettings();

    expect(settings).toEqual({
      whatsappNumber: "573000000000",
      contactEmail: "hola@crazyhour.co",
      contactPhone: "3000000000",
      activeEventTheme: "none",
    });
  });

  it("getWhatsAppNumber returns just the number", async () => {
    const { getWhatsAppNumber } = await import("./settings");

    const number = await getWhatsAppNumber();

    expect(number).toBe("573000000000");
  });

  it("getSettings includes the active event theme", async () => {
    const { getSettings } = await import("./settings");

    const settings = await getSettings();

    expect(settings.activeEventTheme).toBe("none");
  });

  it("getActiveEventTheme returns the current theme", async () => {
    await admin.from("settings").update({ active_event_theme: "navidad" }).eq("id", true);
    const { getActiveEventTheme } = await import("./settings");

    expect(await getActiveEventTheme()).toBe("navidad");
  });
});
