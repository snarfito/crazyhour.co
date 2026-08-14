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
