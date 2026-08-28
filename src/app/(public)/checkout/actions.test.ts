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
  let variantProductId: string;
  let colorGoldOptionId: string;
  let colorSilverOptionId: string;
  let size18OptionId: string;
  let size36OptionId: string;

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

    const { data: variant } = await admin
      .from("products")
      .insert({
        name: `${TEST_PREFIX}Globo metalizado`,
        unit_price_cop: 1000,
        // pack1/pack2 del producto quedan con precios "trampa" — deben
        // ignorarse por completo en cuanto el producto tiene un grupo que
        // afecta precio (solo pack1_qty/pack2_qty, la CANTIDAD, se usa).
        pack1_qty: 10,
        pack1_price_cop: 999999,
        pack2_qty: 5,
        pack2_price_cop: 999999,
        is_active: true,
      })
      .select()
      .single();
    variantProductId = variant!.id;

    const { data: colorAttr } = await admin
      .from("product_attributes")
      .insert({ product_id: variantProductId, kind: "color", display_name: "Color", affects_price: false })
      .select()
      .single();
    const { data: sizeAttr } = await admin
      .from("product_attributes")
      .insert({ product_id: variantProductId, kind: "size", display_name: "Talla", affects_price: true })
      .select()
      .single();

    const { data: colorOptions } = await admin
      .from("attribute_options")
      .insert([
        { attribute_id: colorAttr!.id, display_name: "Chrome Gold" },
        { attribute_id: colorAttr!.id, display_name: "Chrome Silver" },
      ])
      .select();
    colorGoldOptionId = colorOptions!.find((o) => o.display_name === "Chrome Gold")!.id;
    colorSilverOptionId = colorOptions!.find((o) => o.display_name === "Chrome Silver")!.id;

    const { data: sizeOptions } = await admin
      .from("attribute_options")
      .insert([
        {
          attribute_id: sizeAttr!.id,
          display_name: "18 pulgadas",
          unit_price_cop: 3000,
          pack1_price_cop: 2000,
          pack2_price_cop: 2500,
        },
        { attribute_id: sizeAttr!.id, display_name: "36 pulgadas", unit_price_cop: 8000 },
      ])
      .select();
    size18OptionId = sizeOptions!.find((o) => o.display_name === "18 pulgadas")!.id;
    size36OptionId = sizeOptions!.find((o) => o.display_name === "36 pulgadas")!.id;
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
      // Wompi orders aren't confirmed yet at creation time — the
      // received email only goes out once the webhook confirms payment
      // (see route.ts), so it must NOT fire here.
      expect(mockSendOrderReceivedEmail).not.toHaveBeenCalled();

      const { data: items } = await admin.from("order_items").select("*").eq("order_id", result.orderId);
      expect(items).toHaveLength(1);
      expect(items?.[0].unit_price_cop).toBe(45000);
    });

    it("prices a quantity that reaches a wholesale tier entirely at that tier's price", async () => {
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(
        TEST_CUSTOMER,
        [{ productId: tieredProductId, quantity: 36 }]
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const expectedTotal = 36 * 3000; // qty 36 >= pack1_qty (10) → whole qty at pack1's price
      expect(result.amountInCents).toBe(expectedTotal * 100);

      const { data: order } = await admin.from("orders").select("total_cop").eq("id", result.orderId).single();
      expect(order?.total_cop).toBe(expectedTotal);

      const { data: items } = await admin
        .from("order_items")
        .select("quantity, unit_price_cop")
        .eq("order_id", result.orderId)
        .order("unit_price_cop");
      expect(items).toEqual([{ quantity: 36, unit_price_cop: 3000 }]);
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

  describe("phone format validation", () => {
    it("rejects createWompiOrder with a malformed phone, without creating an order", async () => {
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(
        { ...TEST_CUSTOMER, phone: "123" },
        [{ productId: activeProductId, quantity: 1 }]
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/teléfono/i);

      const { data: orders } = await admin.from("orders").select("*").like("customer_name", TEST_PREFIX_LIKE);
      expect(orders).toHaveLength(0);
    });

    it("rejects createWhatsAppOrder with a malformed phone, without creating an order", async () => {
      const { createWhatsAppOrder } = await import("./actions");

      const result = await createWhatsAppOrder(
        { ...TEST_CUSTOMER, phone: "123" },
        [{ productId: activeProductId, quantity: 1 }]
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/teléfono/i);

      const { data: orders } = await admin.from("orders").select("*").like("customer_name", TEST_PREFIX_LIKE);
      expect(orders).toHaveLength(0);
    });
  });

  describe("variant selections (color + talla)", () => {
    it("prices from the size option (affects_price) and records the selections snapshot", async () => {
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(TEST_CUSTOMER, [
        { productId: variantProductId, quantity: 2, selectedOptionIds: [colorGoldOptionId, size18OptionId] },
      ]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.amountInCents).toBe(2 * 3000 * 100); // ignores unit_price_cop=1000, uses the size option's price

      const { data: items } = await admin.from("order_items").select("*").eq("order_id", result.orderId);
      expect(items).toHaveLength(1);
      expect(items?.[0].unit_price_cop).toBe(3000);
      expect(items?.[0].selected_attribute_summary).toBe("Color: Chrome Gold · Talla: 18 pulgadas");

      const { data: selections } = await admin
        .from("order_item_selections")
        .select("attribute_display_name, option_display_name")
        .eq("order_item_id", items![0].id)
        .order("attribute_display_name");
      expect(selections).toEqual([
        { attribute_display_name: "Color", option_display_name: "Chrome Gold" },
        { attribute_display_name: "Talla", option_display_name: "18 pulgadas" },
      ]);
    });

    it("prices a different size option independently", async () => {
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(TEST_CUSTOMER, [
        { productId: variantProductId, quantity: 1, selectedOptionIds: [colorSilverOptionId, size36OptionId] },
      ]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.amountInCents).toBe(8000 * 100);
    });

    it("applies the OPTION's pack1/pack2 price at the product's quantity thresholds, never the product's own pack price", async () => {
      const { createWompiOrder } = await import("./actions");

      // pack1_qty=10 on the product → this quantity crosses it. Must use the
      // 18" option's pack1_price_cop (2000), not the product's fake 999999.
      const pack1Result = await createWompiOrder(TEST_CUSTOMER, [
        { productId: variantProductId, quantity: 10, selectedOptionIds: [colorGoldOptionId, size18OptionId] },
      ]);
      expect(pack1Result.ok).toBe(true);
      if (!pack1Result.ok) return;
      expect(pack1Result.amountInCents).toBe(10 * 2000 * 100);

      // pack2_qty=5, below pack1_qty=10 → the 18" option's pack2_price_cop (2500).
      const pack2Result = await createWompiOrder(TEST_CUSTOMER, [
        { productId: variantProductId, quantity: 5, selectedOptionIds: [colorGoldOptionId, size18OptionId] },
      ]);
      expect(pack2Result.ok).toBe(true);
      if (!pack2Result.ok) return;
      expect(pack2Result.amountInCents).toBe(5 * 2500 * 100);

      // 36" has no pack price of its own → falls back to its own unit price
      // (8000), never to the product's pack1_price_cop/pack2_price_cop.
      const noPackPriceResult = await createWompiOrder(TEST_CUSTOMER, [
        { productId: variantProductId, quantity: 10, selectedOptionIds: [colorGoldOptionId, size36OptionId] },
      ]);
      expect(noPackPriceResult.ok).toBe(true);
      if (!noPackPriceResult.ok) return;
      expect(noPackPriceResult.amountInCents).toBe(10 * 8000 * 100);
    });

    it("rejects when a required attribute has no selected option, without creating an order", async () => {
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(TEST_CUSTOMER, [
        { productId: variantProductId, quantity: 1, selectedOptionIds: [colorGoldOptionId] },
      ]);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.invalidProductIds).toEqual([variantProductId]);

      const { data: orders } = await admin.from("orders").select("*").like("customer_name", TEST_PREFIX_LIKE);
      expect(orders).toHaveLength(0);
    });

    it("rejects an inactive option even if the id is otherwise valid", async () => {
      await admin.from("attribute_options").update({ is_active: false }).eq("id", size18OptionId);
      const { createWompiOrder } = await import("./actions");

      const result = await createWompiOrder(TEST_CUSTOMER, [
        { productId: variantProductId, quantity: 1, selectedOptionIds: [colorGoldOptionId, size18OptionId] },
      ]);

      expect(result.ok).toBe(false);
    });

    it("includes the chosen color and size in the WhatsApp message", async () => {
      const { createWhatsAppOrder } = await import("./actions");

      const result = await createWhatsAppOrder(TEST_CUSTOMER, [
        { productId: variantProductId, quantity: 1, selectedOptionIds: [colorGoldOptionId, size18OptionId] },
      ]);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(decodeURIComponent(result.whatsappUrl)).toContain(
        `${TEST_PREFIX}Globo metalizado — Color: Chrome Gold · Talla: 18 pulgadas`
      );
    });
  });
});
