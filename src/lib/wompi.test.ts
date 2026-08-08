import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHash } from "crypto";

// wompi.ts imports "server-only", which throws when loaded outside a real
// Next.js server render (same fix as dal.test.ts/enhance.test.ts).
vi.mock("server-only", () => ({}));

describe("buildIntegritySignature", () => {
  const ORIGINAL_SECRET = process.env.WOMPI_INTEGRITY_SECRET;

  beforeEach(() => {
    process.env.WOMPI_INTEGRITY_SECRET = "test-integrity-secret";
  });

  afterEach(() => {
    process.env.WOMPI_INTEGRITY_SECRET = ORIGINAL_SECRET;
  });

  it("matches sha256(reference + amountInCents + currency + secret)", async () => {
    const { buildIntegritySignature } = await import("./wompi");

    const signature = buildIntegritySignature({
      reference: "order-123",
      amountInCents: 4500000,
      currency: "COP",
    });

    const expected = createHash("sha256")
      .update("order-1234500000COPtest-integrity-secret")
      .digest("hex");
    expect(signature).toBe(expected);
  });

  it("throws if WOMPI_INTEGRITY_SECRET is unset", async () => {
    delete process.env.WOMPI_INTEGRITY_SECRET;
    const { buildIntegritySignature } = await import("./wompi");

    expect(() =>
      buildIntegritySignature({ reference: "order-123", amountInCents: 100, currency: "COP" })
    ).toThrow();
  });
});

describe("verifyWebhookSignature", () => {
  const ORIGINAL_SECRET = process.env.WOMPI_EVENTS_SECRET;

  beforeEach(() => {
    process.env.WOMPI_EVENTS_SECRET = "test-events-secret";
  });

  afterEach(() => {
    process.env.WOMPI_EVENTS_SECRET = ORIGINAL_SECRET;
  });

  function buildValidPayload() {
    const timestamp = 1700000000;
    const transaction = { id: "txn-1", status: "APPROVED", reference: "order-123", amount_in_cents: 4500000 };
    const checksum = createHash("sha256")
      .update(`${transaction.id}${transaction.status}${transaction.amount_in_cents}${timestamp}test-events-secret`)
      .digest("hex");
    return {
      event: "transaction.updated",
      data: { transaction },
      signature: { properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"], checksum },
      timestamp,
    };
  }

  it("accepts a correctly-signed payload", async () => {
    const { verifyWebhookSignature } = await import("./wompi");

    expect(verifyWebhookSignature(buildValidPayload())).toBe(true);
  });

  it("rejects a payload with a tampered checksum", async () => {
    const { verifyWebhookSignature } = await import("./wompi");
    const payload = buildValidPayload();
    payload.signature.checksum = "0000000000000000000000000000000000000000000000000000000000000000";

    expect(verifyWebhookSignature(payload)).toBe(false);
  });

  it("rejects when WOMPI_EVENTS_SECRET is unset", async () => {
    const { verifyWebhookSignature } = await import("./wompi");
    delete process.env.WOMPI_EVENTS_SECRET;

    expect(verifyWebhookSignature(buildValidPayload())).toBe(false);
  });

  it("returns false (not a throw) for a malformed payload", async () => {
    const { verifyWebhookSignature } = await import("./wompi");
    const malformed = { event: "transaction.updated", data: {}, timestamp: 1700000000 };

    expect(() => verifyWebhookSignature(malformed as any)).not.toThrow();
    expect(verifyWebhookSignature(malformed as any)).toBe(false);
  });
});
