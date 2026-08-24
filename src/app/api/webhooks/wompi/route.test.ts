import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "crypto";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzfase3webhook_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);
const EVENTS_SECRET = "test-events-secret";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

const mockSendOrderReceivedEmail = vi.fn();
vi.mock("@/lib/order-emails", () => ({
  sendOrderReceivedEmail: (...args: unknown[]) => mockSendOrderReceivedEmail(...args),
}));

function signPayload(transaction: { id: string; status: string; reference: string; amount_in_cents: number }) {
  const timestamp = 1700000000;
  const properties = ["transaction.id", "transaction.status", "transaction.reference", "transaction.amount_in_cents"];
  const concatenated = `${transaction.id}${transaction.status}${transaction.reference}${transaction.amount_in_cents}`;
  const checksum = createHash("sha256").update(`${concatenated}${timestamp}${EVENTS_SECRET}`).digest("hex");
  return { event: "transaction.updated", data: { transaction }, signature: { properties, checksum }, timestamp };
}

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("POST /api/webhooks/wompi (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  const ORIGINAL_SECRET = process.env.WOMPI_EVENTS_SECRET;
  let orderId: string;
  let productId: string;

  beforeEach(async () => {
    process.env.WOMPI_EVENTS_SECRET = EVENTS_SECRET;
    mockSendOrderReceivedEmail.mockReset();
    mockSendOrderReceivedEmail.mockResolvedValue(undefined);
    await admin.from("orders").delete().like("customer_name", TEST_PREFIX_LIKE);
    await admin.from("products").delete().like("name", TEST_PREFIX_LIKE);

    const { data: product } = await admin
      .from("products")
      .insert({ name: `${TEST_PREFIX}Piñata estrella`, unit_price_cop: 45000, is_active: true })
      .select()
      .single();
    productId = product!.id;

    const { data: order } = await admin
      .from("orders")
      .insert({
        channel: "wompi",
        status: "pending_wompi",
        total_cop: 45000,
        customer_name: `${TEST_PREFIX}Ana`,
        customer_phone: "3000000000",
        customer_email: "ana@example.com",
        shipping_address: "Calle 1 # 2-34",
        shipping_neighborhood: "Chapinero",
        shipping_city: "Bogotá",
      })
      .select("id")
      .single();
    orderId = order!.id;
    await admin.from("order_items").insert({ order_id: orderId, product_id: productId, quantity: 1, unit_price_cop: 45000 });
  });

  afterEach(() => {
    process.env.WOMPI_EVENTS_SECRET = ORIGINAL_SECRET;
  });

  it("marks the order paid on an APPROVED transaction with a valid signature", async () => {
    const { POST } = await import("./route");
    const payload = signPayload({ id: "txn-1", status: "APPROVED", reference: orderId, amount_in_cents: 4500000 });

    const response = await POST(new Request("http://localhost/api/webhooks/wompi", { method: "POST", body: JSON.stringify(payload) }));

    expect(response.status).toBe(200);
    const { data: order } = await admin.from("orders").select("status, wompi_transaction_id, order_number").eq("id", orderId).single();
    expect(order?.status).toBe("paid");
    expect(order?.wompi_transaction_id).toBe("txn-1");
    expect(mockSendOrderReceivedEmail).toHaveBeenCalledWith({
      customerName: `${TEST_PREFIX}Ana`,
      customerEmail: "ana@example.com",
      orderNumber: order?.order_number,
      items: [{ name: `${TEST_PREFIX}Piñata estrella`, quantity: 1, unitPriceCop: 45000 }],
      totalCop: 45000,
      address: "Calle 1 # 2-34",
      neighborhood: "Chapinero",
      city: "Bogotá",
      extra: undefined,
    });
  });

  it("still marks the order paid when the received-email send fails", async () => {
    mockSendOrderReceivedEmail.mockRejectedValueOnce(new Error("Resend is down"));
    const { POST } = await import("./route");
    const payload = signPayload({ id: "txn-1b", status: "APPROVED", reference: orderId, amount_in_cents: 4500000 });

    const response = await POST(new Request("http://localhost/api/webhooks/wompi", { method: "POST", body: JSON.stringify(payload) }));

    expect(response.status).toBe(200);
    const { data: order } = await admin.from("orders").select("status").eq("id", orderId).single();
    expect(order?.status).toBe("paid");
  });

  it("rejects an invalid signature and leaves the order untouched", async () => {
    const { POST } = await import("./route");
    const payload = signPayload({ id: "txn-2", status: "APPROVED", reference: orderId, amount_in_cents: 4500000 });
    payload.signature.checksum = "tampered";

    const response = await POST(new Request("http://localhost/api/webhooks/wompi", { method: "POST", body: JSON.stringify(payload) }));

    expect(response.status).toBe(401);
    const { data: order } = await admin.from("orders").select("status").eq("id", orderId).single();
    expect(order?.status).toBe("pending_wompi");
  });

  it("accepts but ignores a non-APPROVED status", async () => {
    const { POST } = await import("./route");
    const payload = signPayload({ id: "txn-3", status: "DECLINED", reference: orderId, amount_in_cents: 4500000 });

    const response = await POST(new Request("http://localhost/api/webhooks/wompi", { method: "POST", body: JSON.stringify(payload) }));

    expect(response.status).toBe(200);
    const { data: order } = await admin.from("orders").select("status").eq("id", orderId).single();
    expect(order?.status).toBe("pending_wompi");
  });

  it("returns 401 for a non-JSON body", async () => {
    const { POST } = await import("./route");

    const response = await POST(new Request("http://localhost/api/webhooks/wompi", { method: "POST", body: "not json" }));

    expect(response.status).toBe(401);
    const { data: order } = await admin.from("orders").select("status").eq("id", orderId).single();
    expect(order?.status).toBe("pending_wompi");
  });

  it("does not re-process an order that's already paid (idempotent)", async () => {
    const { POST } = await import("./route");
    await admin.from("orders").update({ status: "paid", wompi_transaction_id: "txn-original" }).eq("id", orderId);
    const payload = signPayload({ id: "txn-4", status: "APPROVED", reference: orderId, amount_in_cents: 4500000 });

    await POST(new Request("http://localhost/api/webhooks/wompi", { method: "POST", body: JSON.stringify(payload) }));

    const { data: order } = await admin.from("orders").select("wompi_transaction_id").eq("id", orderId).single();
    expect(order?.wompi_transaction_id).toBe("txn-original"); // untouched, not overwritten by the resend
    expect(mockSendOrderReceivedEmail).not.toHaveBeenCalled(); // no duplicate email on a webhook retry
  });
});
