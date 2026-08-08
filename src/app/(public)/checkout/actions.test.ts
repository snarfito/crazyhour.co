import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzfase3checkout_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

process.env.WOMPI_INTEGRITY_SECRET = "test-integrity-secret";
process.env.WOMPI_PUBLIC_KEY = "pub_test_xxx";

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("checkout actions (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  let categoryId: string;
  let activeProductId: string;
  let inactiveProductId: string;

  beforeEach(async () => {
    await admin.from("orders").delete().like("customer_name", TEST_PREFIX_LIKE);
    const { data: cats } = await admin.from("categories").select("id").like("slug", TEST_PREFIX_LIKE);
    const catIds = (cats ?? []).map((c) => c.id);
    if (catIds.length > 0) await admin.from("products").delete().in("category_id", catIds);
    await admin.from("categories").delete().like("slug", TEST_PREFIX_LIKE);

    const { data: category } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 })
      .select()
      .single();
    categoryId = category!.id;

    const { data: active } = await admin
      .from("products")
      .insert({ category_id: categoryId, name: "Piñata estrella", price_cop: 45000, is_active: true })
      .select()
      .single();
    activeProductId = active!.id;

    const { data: inactive } = await admin
      .from("products")
      .insert({ category_id: categoryId, name: "Piñata descontinuada", price_cop: 30000, is_active: false })
      .select()
      .single();
    inactiveProductId = inactive!.id;

    await admin.from("settings").update({ whatsapp_number: "573000000000" }).eq("id", true);
  });

  describe("createWompiOrder", () => {
    it("creates a pending_wompi order priced from the DB, ignoring client-supplied prices", async () => {
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(
        { name: `${TEST_PREFIX}Ana`, phone: "3000000000" },
        [{ productId: activeProductId, quantity: 2 }]
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.amountInCents).toBe(9000000); // 2 * 45000 * 100
      expect(result.reference).toBe(result.orderId);
      expect(result.signature).toHaveLength(64);

      const { data: order } = await admin.from("orders").select("*").eq("id", result.orderId).single();
      expect(order?.status).toBe("pending_wompi");
      expect(order?.channel).toBe("wompi");
      expect(order?.total_cop).toBe(90000);

      const { data: items } = await admin.from("order_items").select("*").eq("order_id", result.orderId);
      expect(items).toHaveLength(1);
      expect(items?.[0].unit_price_cop).toBe(45000);
    });

    it("rejects and reports inactive products without creating an order", async () => {
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(
        { name: `${TEST_PREFIX}Ana`, phone: "3000000000" },
        [{ productId: activeProductId, quantity: 1 }, { productId: inactiveProductId, quantity: 1 }]
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.invalidProductIds).toEqual([inactiveProductId]);

      const { data: orders } = await admin.from("orders").select("*").like("customer_name", TEST_PREFIX_LIKE);
      expect(orders).toHaveLength(0);
    });
  });

  describe("createWhatsAppOrder", () => {
    it("creates a pending_whatsapp order and returns a wa.me link using the configured number", async () => {
      const { createWhatsAppOrder } = await import("./actions");

      const result = await createWhatsAppOrder(
        { name: `${TEST_PREFIX}Ana`, phone: "3000000000" },
        [{ productId: activeProductId, quantity: 3 }]
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.whatsappUrl).toContain("https://wa.me/573000000000");

      const { data: order } = await admin.from("orders").select("*").eq("id", result.orderId).single();
      expect(order?.status).toBe("pending_whatsapp");
      expect(order?.channel).toBe("whatsapp");
      expect(order?.total_cop).toBe(135000);
    });
  });
});
