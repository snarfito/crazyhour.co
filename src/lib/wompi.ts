import "server-only";
import { createHash } from "crypto";

export type WompiWebhookPayload = {
  event: string;
  data: {
    transaction: {
      id: string;
      status: string;
      reference: string;
      amount_in_cents: number;
    };
  };
  signature: {
    properties: string[];
    checksum: string;
  };
  timestamp: number;
};

export function buildIntegritySignature({
  reference,
  amountInCents,
  currency,
}: {
  reference: string;
  amountInCents: number;
  currency: string;
}): string {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) throw new Error("WOMPI_INTEGRITY_SECRET no está configurado.");
  return createHash("sha256").update(`${reference}${amountInCents}${currency}${secret}`).digest("hex");
}

function getByPath(data: WompiWebhookPayload["data"], path: string): string {
  const value = path
    .split(".")
    .reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), data);
  return String(value ?? "");
}

export function verifyWebhookSignature(payload: WompiWebhookPayload): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret) return false;

  try {
    const concatenatedValues = payload.signature.properties.map((path) => getByPath(payload.data, path)).join("");
    const expected = createHash("sha256")
      .update(`${concatenatedValues}${payload.timestamp}${secret}`)
      .digest("hex");

    return expected.toLowerCase() === payload.signature.checksum.toLowerCase();
  } catch {
    return false;
  }
}
