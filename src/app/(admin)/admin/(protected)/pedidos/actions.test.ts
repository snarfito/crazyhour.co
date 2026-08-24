import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzfase3pedidos_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);

const mockRequirePermission = vi.fn();

vi.mock("@/lib/supabase/dal", () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("markOrderPaid (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    mockRequirePermission.mockResolvedValue({ userId: "test-admin", email: "test@crazyhour.co" });
    await admin.from("orders").delete().like("customer_name", TEST_PREFIX_LIKE);
  });

  it("marks a pending_whatsapp order as paid", async () => {
    const { data: order } = await admin
      .from("orders")
      .insert({ channel: "whatsapp", status: "pending_whatsapp", total_cop: 20000, customer_name: `${TEST_PREFIX}Ana`, customer_phone: "3000000000" })
      .select("id")
      .single();
    const { markOrderPaid } = await import("./actions");

    await markOrderPaid(order!.id);

    const { data: updated } = await admin.from("orders").select("status").eq("id", order!.id).single();
    expect(updated?.status).toBe("paid");
    expect(mockRequirePermission).toHaveBeenCalledWith("pedidos");
  });

  it("does not touch a pending_wompi order — Wompi orders confirm only via the webhook", async () => {
    const { data: order } = await admin
      .from("orders")
      .insert({ channel: "wompi", status: "pending_wompi", total_cop: 20000, customer_name: `${TEST_PREFIX}Ana`, customer_phone: "3000000000" })
      .select("id")
      .single();
    const { markOrderPaid } = await import("./actions");

    await markOrderPaid(order!.id);

    const { data: updated } = await admin.from("orders").select("status").eq("id", order!.id).single();
    expect(updated?.status).toBe("pending_wompi");
  });

  it("propagates rejection when the caller lacks the pedidos permission, without writing", async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const { data: order } = await admin
      .from("orders")
      .insert({ channel: "whatsapp", status: "pending_whatsapp", total_cop: 20000, customer_name: `${TEST_PREFIX}Rechazado`, customer_phone: "3000000000" })
      .select("id")
      .single();
    const { markOrderPaid } = await import("./actions");

    await expect(markOrderPaid(order!.id)).rejects.toThrow();

    const { data: unchanged } = await admin.from("orders").select("status").eq("id", order!.id).single();
    expect(unchanged?.status).toBe("pending_whatsapp");
  });
});

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("updateCustomerDetails (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    mockRequirePermission.mockResolvedValue({ userId: "test-admin", email: "test@crazyhour.co" });
    await admin.from("orders").delete().like("customer_name", TEST_PREFIX_LIKE);
  });

  it("updates the customer's name, phone, email, and shipping address", async () => {
    const { data: order } = await admin
      .from("orders")
      .insert({
        channel: "whatsapp",
        status: "pending_whatsapp",
        total_cop: 20000,
        customer_name: `${TEST_PREFIX}Ana`,
        customer_phone: "3000000000",
      })
      .select("id")
      .single();
    const { updateCustomerDetails } = await import("./actions");

    const formData = new FormData();
    formData.set("customer_name", `${TEST_PREFIX}Ana Editada`);
    formData.set("customer_phone", "3000000001");
    formData.set("customer_email", "ana2@example.com");
    formData.set("shipping_address", "Calle 2 # 3-45");
    formData.set("shipping_neighborhood", "Laureles");
    formData.set("shipping_city", "Medellín");
    formData.set("shipping_extra", "Casa 2");

    await updateCustomerDetails(order!.id, formData);

    const { data: updated } = await admin.from("orders").select("*").eq("id", order!.id).single();
    expect(updated?.customer_name).toBe(`${TEST_PREFIX}Ana Editada`);
    expect(updated?.customer_phone).toBe("3000000001");
    expect(updated?.customer_email).toBe("ana2@example.com");
    expect(updated?.shipping_address).toBe("Calle 2 # 3-45");
    expect(updated?.shipping_neighborhood).toBe("Laureles");
    expect(updated?.shipping_city).toBe("Medellín");
    expect(updated?.shipping_extra).toBe("Casa 2");
    expect(mockRequirePermission).toHaveBeenCalledWith("pedidos");
  });

  it("stores a blank additional-info field as null", async () => {
    const { data: order } = await admin
      .from("orders")
      .insert({
        channel: "whatsapp",
        status: "pending_whatsapp",
        total_cop: 20000,
        customer_name: `${TEST_PREFIX}SinExtra`,
        customer_phone: "3000000000",
      })
      .select("id")
      .single();
    const { updateCustomerDetails } = await import("./actions");

    const formData = new FormData();
    formData.set("customer_name", `${TEST_PREFIX}SinExtra`);
    formData.set("customer_phone", "3000000000");
    formData.set("customer_email", "sin@example.com");
    formData.set("shipping_address", "Calle 2 # 3-45");
    formData.set("shipping_neighborhood", "Laureles");
    formData.set("shipping_city", "Medellín");
    formData.set("shipping_extra", "");

    await updateCustomerDetails(order!.id, formData);

    const { data: updated } = await admin.from("orders").select("shipping_extra").eq("id", order!.id).single();
    expect(updated?.shipping_extra).toBeNull();
  });

  it("propagates rejection when the caller lacks the pedidos permission, without writing", async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const { data: order } = await admin
      .from("orders")
      .insert({
        channel: "whatsapp",
        status: "pending_whatsapp",
        total_cop: 20000,
        customer_name: `${TEST_PREFIX}Rechazado`,
        customer_phone: "3000000000",
      })
      .select("id")
      .single();
    const { updateCustomerDetails } = await import("./actions");

    const formData = new FormData();
    formData.set("customer_name", `${TEST_PREFIX}Cambiado`);
    formData.set("customer_phone", "3000000001");
    formData.set("customer_email", "x@example.com");
    formData.set("shipping_address", "Calle 2 # 3-45");
    formData.set("shipping_city", "Medellín");

    await expect(updateCustomerDetails(order!.id, formData)).rejects.toThrow();

    const { data: unchanged } = await admin.from("orders").select("customer_name").eq("id", order!.id).single();
    expect(unchanged?.customer_name).toBe(`${TEST_PREFIX}Rechazado`);
  });
});
