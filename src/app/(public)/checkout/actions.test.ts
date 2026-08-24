import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzfase3checkout_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);
const TEST_CUSTOMER = {
  name: `${TEST_PREFIX}Ana`,
  phone: "3000000000",
  email: "ana@example.com",
  address: "Calle 1 # 2-34",
  neighborhood: "Chapinero",
  city: "Bogotá",
  extra: "Apto 502",
};

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

const mockSendOrderReceivedEmail = vi.fn();
vi.mock("@/lib/order-emails", () => ({
  sendOrderReceivedEmail: (...args: unknown[]) => mockSendOrderReceivedEmail(...args),
}));

process.env.WOMPI_INTEGRITY_SECRET = "test-integrity-secret";
process.env.WOMPI_PUBLIC_KEY = "pub_test_xxx";

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("checkout actions (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  let activeProductId: string;
  let inactiveProductId: string;
  let tieredProductId: string;

  beforeEach(async () => {
    mockSendOrderReceivedEmail.mockReset();
    mockSendOrderReceivedEmail.mockResolvedValue(undefined);
    await admin.from("orders").delete().like("customer_name", TEST_PREFIX_LIKE);
    // Products no longer FK to a category — scoped by their own prefixed
    // name now, cleaned up directly.
    await admin.from("products").delete().like("name", TEST_PREFIX_LIKE);

    const { data: active } = await admin
      .from("products")
      .insert({ name: `${TEST_PREFIX}Piñata estrella`, unit_price_cop: 45000, is_active: true })
      .select()
      .single();
    activeProductId = active!.id;

    const { data: inactive } = await admin
      .from("products")
      .insert({ name: `${TEST_PREFIX}Piñata descontinuada`, unit_price_cop: 30000, is_active: false })
      .select()
      .single();
    inactiveProductId = inactive!.id;

    const { data: tiered } = await admin
      .from("products")
      .insert({
        name: `${TEST_PREFIX}Globo por mayor`,
        unit_price_cop: 4000,
        pack1_qty: 10,
        pack1_price_cop: 3000,
        pack2_qty: 5,
        pack2_price_cop: 3500,
        is_active: true,
      })
      .select()
      .single();
    tieredProductId = tiered!.id;

    await admin.from("settings").update({ whatsapp_number: "573000000000" }).eq("id", true);
  });

  describe("createWompiOrder", () => {
    it("creates a pending_wompi order priced from the DB, ignoring client-supplied prices", async () => {
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(
        TEST_CUSTOMER,
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
      expect(order?.customer_email).toBe("ana@example.com");
      expect(order?.shipping_address).toBe("Calle 1 # 2-34");
      expect(order?.shipping_neighborhood).toBe("Chapinero");
      expect(order?.shipping_city).toBe("Bogotá");
      expect(order?.shipping_extra).toBe("Apto 502");
      expect(typeof result.orderNumber).toBe("number");
      expect(order?.order_number).toBe(result.orderNumber);
      expect(mockSendOrderReceivedEmail).toHaveBeenCalledWith({
        customerName: TEST_CUSTOMER.name,
        customerEmail: TEST_CUSTOMER.email,
        orderNumber: result.orderNumber,
        items: [{ productId: activeProductId, name: `${TEST_PREFIX}Piñata estrella`, quantity: 2, unitPriceCop: 45000 }],
        totalCop: 90000,
        address: TEST_CUSTOMER.address,
        neighborhood: TEST_CUSTOMER.neighborhood,
        city: TEST_CUSTOMER.city,
        extra: TEST_CUSTOMER.extra,
      });

      const { data: items } = await admin.from("order_items").select("*").eq("order_id", result.orderId);
      expect(items).toHaveLength(1);
      expect(items?.[0].unit_price_cop).toBe(45000);
    });

    it("still creates the order when the received-email send fails", async () => {
      mockSendOrderReceivedEmail.mockRejectedValueOnce(new Error("Resend is down"));
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(TEST_CUSTOMER, [{ productId: activeProductId, quantity: 1 }]);

      expect(result.ok).toBe(true);
    });

    it("splits a quantity that crosses tiers into one order_items row per tier consumed", async () => {
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(
        TEST_CUSTOMER,
        [{ productId: tieredProductId, quantity: 36 }]
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const expectedTotal = 30 * 3000 + 5 * 3500 + 1 * 4000;
      expect(result.amountInCents).toBe(expectedTotal * 100);

      const { data: order } = await admin.from("orders").select("total_cop").eq("id", result.orderId).single();
      expect(order?.total_cop).toBe(expectedTotal);

      const { data: items } = await admin
        .from("order_items")
        .select("quantity, unit_price_cop")
        .eq("order_id", result.orderId)
        .order("unit_price_cop");
      expect(items).toEqual([
        { quantity: 30, unit_price_cop: 3000 },
        { quantity: 5, unit_price_cop: 3500 },
        { quantity: 1, unit_price_cop: 4000 },
      ]);
    });

    it("rejects and reports inactive products without creating an order", async () => {
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(
        TEST_CUSTOMER,
        [{ productId: activeProductId, quantity: 1 }, { productId: inactiveProductId, quantity: 1 }]
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.invalidProductIds).toEqual([inactiveProductId]);

      const { data: orders } = await admin.from("orders").select("*").like("customer_name", TEST_PREFIX_LIKE);
      expect(orders).toHaveLength(0);
    });

    it("rejects a non-positive quantity without creating an order", async () => {
      const { createWompiOrder } = await import("./actions");

      const zeroResult = await createWompiOrder(
        TEST_CUSTOMER,
        [{ productId: activeProductId, quantity: 0 }]
      );
      expect(zeroResult.ok).toBe(false);
      if (zeroResult.ok) return;
      expect(zeroResult.invalidProductIds).toEqual([activeProductId]);

      const negativeResult = await createWompiOrder(
        TEST_CUSTOMER,
        [{ productId: activeProductId, quantity: -1 }]
      );
      expect(negativeResult.ok).toBe(false);
      if (negativeResult.ok) return;
      expect(negativeResult.invalidProductIds).toEqual([activeProductId]);

      const { data: orders } = await admin.from("orders").select("*").like("customer_name", TEST_PREFIX_LIKE);
      expect(orders).toHaveLength(0);
    });

    it("rejects an empty cart without creating an order", async () => {
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(TEST_CUSTOMER, []);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.invalidProductIds).toEqual([]);

      const { data: orders } = await admin.from("orders").select("*").like("customer_name", TEST_PREFIX_LIKE);
      expect(orders).toHaveLength(0);
    });
  });

  describe("createWhatsAppOrder", () => {
    it("creates a pending_whatsapp order and returns a wa.me link using the configured number", async () => {
      const { createWhatsAppOrder } = await import("./actions");

      const result = await createWhatsAppOrder(
        TEST_CUSTOMER,
        [{ productId: activeProductId, quantity: 3 }]
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.whatsappUrl).toContain("https://wa.me/573000000000");

      const { data: order } = await admin.from("orders").select("*").eq("id", result.orderId).single();
      expect(order?.status).toBe("pending_whatsapp");
      expect(order?.channel).toBe("whatsapp");
      expect(order?.total_cop).toBe(135000);
      expect(order?.customer_email).toBe("ana@example.com");
      expect(order?.shipping_address).toBe("Calle 1 # 2-34");
      expect(order?.shipping_neighborhood).toBe("Chapinero");
      expect(order?.shipping_city).toBe("Bogotá");
      expect(order?.shipping_extra).toBe("Apto 502");
      expect(decodeURIComponent(result.whatsappUrl)).toContain("Dirección de envío: Calle 1 # 2-34, Chapinero, Bogotá");
      expect(decodeURIComponent(result.whatsappUrl)).toContain("Información adicional: Apto 502");
      expect(typeof result.orderNumber).toBe("number");
      expect(order?.order_number).toBe(result.orderNumber);
      expect(decodeURIComponent(result.whatsappUrl)).toContain(`Pedido #${result.orderNumber}`);
      expect(mockSendOrderReceivedEmail).toHaveBeenCalledWith({
        customerName: TEST_CUSTOMER.name,
        customerEmail: TEST_CUSTOMER.email,
        orderNumber: result.orderNumber,
        items: [{ productId: activeProductId, name: `${TEST_PREFIX}Piñata estrella`, quantity: 3, unitPriceCop: 45000 }],
        totalCop: 135000,
        address: TEST_CUSTOMER.address,
        neighborhood: TEST_CUSTOMER.neighborhood,
        city: TEST_CUSTOMER.city,
        extra: TEST_CUSTOMER.extra,
      });
    });

    it("still creates the order when the received-email send fails", async () => {
      mockSendOrderReceivedEmail.mockRejectedValueOnce(new Error("Resend is down"));
      const { createWhatsAppOrder } = await import("./actions");

      const result = await createWhatsAppOrder(TEST_CUSTOMER, [{ productId: activeProductId, quantity: 1 }]);

      expect(result.ok).toBe(true);
    });
  });

  describe("email format validation", () => {
    it("rejects createWompiOrder with a malformed email, without creating an order", async () => {
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(
        { ...TEST_CUSTOMER, email: "not-an-email" },
        [{ productId: activeProductId, quantity: 1 }]
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/correo/i);

      const { data: orders } = await admin.from("orders").select("*").like("customer_name", TEST_PREFIX_LIKE);
      expect(orders).toHaveLength(0);
    });

    it("rejects createWhatsAppOrder with a malformed email, without creating an order", async () => {
      const { createWhatsAppOrder } = await import("./actions");

      const result = await createWhatsAppOrder(
        { ...TEST_CUSTOMER, email: "not-an-email" },
        [{ productId: activeProductId, quantity: 1 }]
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/correo/i);

      const { data: orders } = await admin.from("orders").select("*").like("customer_name", TEST_PREFIX_LIKE);
      expect(orders).toHaveLength(0);
    });
  });
});
