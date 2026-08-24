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

const mockSendOrderShippedEmail = vi.fn();
vi.mock("@/lib/order-emails", () => ({
  sendOrderShippedEmail: (...args: unknown[]) => mockSendOrderShippedEmail(...args),
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

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("markOrderPreparing (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    mockRequirePermission.mockResolvedValue({ userId: "test-admin", email: "test@crazyhour.co" });
    await admin.from("orders").delete().like("customer_name", TEST_PREFIX_LIKE);
  });

  it("marks a paid order as alistando", async () => {
    const { data: order } = await admin
      .from("orders")
      .insert({ channel: "whatsapp", status: "paid", total_cop: 20000, customer_name: `${TEST_PREFIX}Ana`, customer_phone: "3000000000" })
      .select("id")
      .single();
    const { markOrderPreparing } = await import("./actions");

    await markOrderPreparing(order!.id);

    const { data: updated } = await admin.from("orders").select("status").eq("id", order!.id).single();
    expect(updated?.status).toBe("alistando");
    expect(mockRequirePermission).toHaveBeenCalledWith("pedidos");
  });

  it("does not touch a pending_whatsapp order — only paid orders can move to alistando", async () => {
    const { data: order } = await admin
      .from("orders")
      .insert({ channel: "whatsapp", status: "pending_whatsapp", total_cop: 20000, customer_name: `${TEST_PREFIX}Ana`, customer_phone: "3000000000" })
      .select("id")
      .single();
    const { markOrderPreparing } = await import("./actions");

    await markOrderPreparing(order!.id);

    const { data: updated } = await admin.from("orders").select("status").eq("id", order!.id).single();
    expect(updated?.status).toBe("pending_whatsapp");
  });

  it("propagates rejection when the caller lacks the pedidos permission, without writing", async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const { data: order } = await admin
      .from("orders")
      .insert({ channel: "whatsapp", status: "paid", total_cop: 20000, customer_name: `${TEST_PREFIX}Rechazado`, customer_phone: "3000000000" })
      .select("id")
      .single();
    const { markOrderPreparing } = await import("./actions");

    await expect(markOrderPreparing(order!.id)).rejects.toThrow();

    const { data: unchanged } = await admin.from("orders").select("status").eq("id", order!.id).single();
    expect(unchanged?.status).toBe("paid");
  });
});

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("markOrderShipped (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    mockRequirePermission.mockResolvedValue({ userId: "test-admin", email: "test@crazyhour.co" });
    mockSendOrderShippedEmail.mockReset();
    mockSendOrderShippedEmail.mockResolvedValue(undefined);
    await admin.from("orders").delete().like("customer_name", TEST_PREFIX_LIKE);
  });

  it("marks an alistando order as shipped with the selected carrier and tracking number", async () => {
    const { data: order } = await admin
      .from("orders")
      .insert({
        channel: "whatsapp",
        status: "alistando",
        total_cop: 20000,
        customer_name: `${TEST_PREFIX}Ana`,
        customer_phone: "3000000000",
        customer_email: "ana@example.com",
      })
      .select("id")
      .single();
    const { markOrderShipped } = await import("./actions");

    const formData = new FormData();
    formData.set("shipping_carrier", "Servientrega");
    formData.set("tracking_number", "SV123456789");

    await markOrderShipped(order!.id, formData);

    const { data: updated } = await admin.from("orders").select("*").eq("id", order!.id).single();
    expect(updated?.status).toBe("shipped");
    expect(updated?.shipping_carrier).toBe("Servientrega");
    expect(updated?.tracking_number).toBe("SV123456789");
    expect(mockRequirePermission).toHaveBeenCalledWith("pedidos");
    expect(mockSendOrderShippedEmail).toHaveBeenCalledWith({
      customerName: `${TEST_PREFIX}Ana`,
      customerEmail: "ana@example.com",
      carrier: "Servientrega",
      trackingNumber: "SV123456789",
    });
  });

  it("still marks the order shipped when the shipped-email send fails", async () => {
    mockSendOrderShippedEmail.mockRejectedValueOnce(new Error("Resend is down"));
    const { data: order } = await admin
      .from("orders")
      .insert({
        channel: "whatsapp",
        status: "alistando",
        total_cop: 20000,
        customer_name: `${TEST_PREFIX}Ana`,
        customer_phone: "3000000000",
        customer_email: "ana@example.com",
      })
      .select("id")
      .single();
    const { markOrderShipped } = await import("./actions");

    const formData = new FormData();
    formData.set("shipping_carrier", "TCC");
    formData.set("tracking_number", "TCC-1");

    await markOrderShipped(order!.id, formData);

    const { data: updated } = await admin.from("orders").select("status").eq("id", order!.id).single();
    expect(updated?.status).toBe("shipped");
  });

  it("uses the free-text carrier when 'otro' is selected", async () => {
    const { data: order } = await admin
      .from("orders")
      .insert({ channel: "whatsapp", status: "alistando", total_cop: 20000, customer_name: `${TEST_PREFIX}Ana`, customer_phone: "3000000000" })
      .select("id")
      .single();
    const { markOrderShipped } = await import("./actions");

    const formData = new FormData();
    formData.set("shipping_carrier", "otro");
    formData.set("shipping_carrier_other", "Mensajería del barrio");
    formData.set("tracking_number", "MB-01");

    await markOrderShipped(order!.id, formData);

    const { data: updated } = await admin.from("orders").select("shipping_carrier").eq("id", order!.id).single();
    expect(updated?.shipping_carrier).toBe("Mensajería del barrio");
  });

  it("does not touch a paid order — only alistando orders can be marked shipped", async () => {
    const { data: order } = await admin
      .from("orders")
      .insert({ channel: "whatsapp", status: "paid", total_cop: 20000, customer_name: `${TEST_PREFIX}Ana`, customer_phone: "3000000000" })
      .select("id")
      .single();
    const { markOrderShipped } = await import("./actions");

    const formData = new FormData();
    formData.set("shipping_carrier", "TCC");
    formData.set("tracking_number", "TCC-1");

    await markOrderShipped(order!.id, formData);

    const { data: updated } = await admin.from("orders").select("status").eq("id", order!.id).single();
    expect(updated?.status).toBe("paid");
  });

  it("propagates rejection when the caller lacks the pedidos permission, without writing", async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const { data: order } = await admin
      .from("orders")
      .insert({ channel: "whatsapp", status: "alistando", total_cop: 20000, customer_name: `${TEST_PREFIX}Rechazado`, customer_phone: "3000000000" })
      .select("id")
      .single();
    const { markOrderShipped } = await import("./actions");

    const formData = new FormData();
    formData.set("shipping_carrier", "TCC");
    formData.set("tracking_number", "TCC-1");

    await expect(markOrderShipped(order!.id, formData)).rejects.toThrow();

    const { data: unchanged } = await admin.from("orders").select("status").eq("id", order!.id).single();
    expect(unchanged?.status).toBe("alistando");
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
