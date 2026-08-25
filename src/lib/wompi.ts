import "server-only";
import { createHash, timingSafeEqual } from "crypto";

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

// Wompi's `signature.properties` genuinely varies per event (their docs: "los properties
// pueden variar, siempre extráelos del evento") — transaction.updated signs only
// [id, status, amount_in_cents], never reference. Hardcoding a fixed list here (as a prior
// "security fix" did) makes the checksum diverge from Wompi's real one and rejects every
// legitimate webhook. We read the request's own properties order, but still require these
// three so an attacker can't strip amount_in_cents out of what's hashed.
const REQUIRED_SIGNED_PROPERTIES = ["transaction.id", "transaction.status", "transaction.amount_in_cents"];

export function verifyWebhookSignature(payload: WompiWebhookPayload): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret) return false;

  try {
    const properties = payload.signature.properties;
    if (!REQUIRED_SIGNED_PROPERTIES.every((required) => properties.includes(required))) return false;

    const concatenatedValues = properties.map((path) => getByPath(payload.data, path)).join("");
    const expected = createHash("sha256")
      .update(`${concatenatedValues}${payload.timestamp}${secret}`)
      .digest("hex");

    return timingSafeEqual(Buffer.from(expected.toLowerCase()), Buffer.from(payload.signature.checksum.toLowerCase()));
  } catch {
    return false;
  }
}
