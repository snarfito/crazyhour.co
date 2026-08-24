import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";
import { SITE_URL } from "@/lib/site";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzfase4sitemap_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("sitemap", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    await admin.from("products").delete().like("name", TEST_PREFIX_LIKE);
    await admin.from("categories").delete().like("slug", TEST_PREFIX_LIKE);
  });

  it("includes the home page, every category, and only active products", async () => {
    const { data: category } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 })
      .select()
      .single();
    const { data: products } = await admin
      .from("products")
      .insert([
        { name: `${TEST_PREFIX}Activo`, description: "x", unit_price_cop: 1000, is_active: true },
        { name: `${TEST_PREFIX}Inactivo`, description: "x", unit_price_cop: 1000, is_active: false },
      ])
      .select();
    const active = products!.find((p) => p.name === `${TEST_PREFIX}Activo`)!;
    const inactive = products!.find((p) => p.name === `${TEST_PREFIX}Inactivo`)!;

    const sitemap = (await import("./sitemap")).default;
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toContain(SITE_URL);
    expect(urls).toContain(`${SITE_URL}/${category!.slug}`);
    expect(urls).toContain(`${SITE_URL}/producto/${active.id}`);
    expect(urls).not.toContain(`${SITE_URL}/producto/${inactive.id}`);
  });
});
