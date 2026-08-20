import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";
import { fetchFilteredOrders, fetchOrderItemsByOrderIds } from "./queries";

vi.mock("server-only", () => ({}));

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzfase4pedidosquery_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("pedidos queries (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  let productId: string;

  beforeEach(async () => {
    await admin.from("orders").delete().like("customer_name", TEST_PREFIX_LIKE);
    await admin.from("products").delete().like("name", TEST_PREFIX_LIKE);

    const { data: product } = await admin
      .from("products")
      .insert({ name: `${TEST_PREFIX}Piñata estrella`, unit_price_cop: 45000, is_active: true })
      .select()
      .single();
    productId = product!.id;
  });

  async function insertOrder(overrides: Record<string, unknown>) {
    const { data: order } = await admin
      .from("orders")
      .insert({
        channel: "whatsapp",
        status: "pending_whatsapp",
        total_cop: 45000,
        customer_name: `${TEST_PREFIX}Ana`,
        customer_phone: "3000000000",
        ...overrides,
      })
      .select()
      .single();
    return order!;
  }

  describe("fetchFilteredOrders", () => {
    it("filters by canal", async () => {
      await insertOrder({ channel: "whatsapp", customer_name: `${TEST_PREFIX}WA` });
      await insertOrder({ channel: "wompi", status: "pending_wompi", customer_name: `${TEST_PREFIX}Wompi` });

      const result = await fetchFilteredOrders(admin, { desde: null, hasta: null, canal: "wompi", estado: null, cliente: TEST_PREFIX });

      expect(result).toHaveLength(1);
      expect(result[0].customer_name).toBe(`${TEST_PREFIX}Wompi`);
    });

    it("filters by estado", async () => {
      await insertOrder({ status: "pending_whatsapp", customer_name: `${TEST_PREFIX}Pendiente` });
      await insertOrder({ status: "paid", customer_name: `${TEST_PREFIX}Pagado` });

      const result = await fetchFilteredOrders(admin, { desde: null, hasta: null, canal: null, estado: "paid", cliente: TEST_PREFIX });

      expect(result).toHaveLength(1);
      expect(result[0].customer_name).toBe(`${TEST_PREFIX}Pagado`);
    });

    it("filters by cliente across name and phone, case-insensitively", async () => {
      await insertOrder({ customer_name: `${TEST_PREFIX}Maria Perez`, customer_phone: "3111111111" });
      await insertOrder({ customer_name: `${TEST_PREFIX}Otro Cliente`, customer_phone: "3222222222" });

      const byName = await fetchFilteredOrders(admin, { desde: null, hasta: null, canal: null, estado: null, cliente: "maria" });
      expect(byName.every((o) => o.customer_name.includes(`${TEST_PREFIX}Maria`))).toBe(true);
      expect(byName.some((o) => o.customer_name === `${TEST_PREFIX}Maria Perez`)).toBe(true);

      const byPhone = await fetchFilteredOrders(admin, { desde: null, hasta: null, canal: null, estado: null, cliente: "3222222222" });
      expect(byPhone.map((o) => o.customer_phone)).toContain("3222222222");
    });

    it("filters by date range", async () => {
      const inRange = await insertOrder({ customer_name: `${TEST_PREFIX}EnRango` });
      const desde = new Date(inRange.created_at);
      desde.setMinutes(desde.getMinutes() - 1);
      const hasta = new Date(inRange.created_at);
      hasta.setMinutes(hasta.getMinutes() + 1);

      const result = await fetchFilteredOrders(admin, {
        desde: desde.toISOString(),
        hasta: hasta.toISOString(),
        canal: null,
        estado: null,
        cliente: TEST_PREFIX,
      });

      expect(result.map((o) => o.id)).toContain(inRange.id);
    });
  });

  describe("fetchOrderItemsByOrderIds", () => {
    it("groups items by order and resolves product names", async () => {
      const order = await insertOrder({ customer_name: `${TEST_PREFIX}ConItems` });
      await admin.from("order_items").insert({ order_id: order.id, product_id: productId, quantity: 2, unit_price_cop: 45000 });

      const result = await fetchOrderItemsByOrderIds(admin, [order.id]);

      expect(result[order.id]).toEqual([{ name: `${TEST_PREFIX}Piñata estrella`, quantity: 2, unitPriceCop: 45000 }]);
    });

    it("returns an empty object for an empty order id list", async () => {
      const result = await fetchOrderItemsByOrderIds(admin, []);
      expect(result).toEqual({});
    });
  });
});
