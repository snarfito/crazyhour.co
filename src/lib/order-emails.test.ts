import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { buildOrderReceivedEmail, buildOrderShippedEmail } = await import("./order-emails");

describe("buildOrderReceivedEmail", () => {
  it("includes customer name, items, total, and shipping address", () => {
    const html = buildOrderReceivedEmail({
      customerName: "Ana",
      orderNumber: 1042,
      items: [
        { name: "Piñata estrella", quantity: 2, unitPriceCop: 45000 },
        { name: "Globo metálico", quantity: 5, unitPriceCop: 5000 },
      ],
      totalCop: 115000,
      address: "Calle 1 # 2-34",
      neighborhood: "Chapinero",
      city: "Bogotá",
      extra: "Apto 502",
    });

    expect(html).toContain("#1042");
    expect(html).toContain("Ana");
    expect(html).toContain("2x Piñata estrella");
    expect(html).toContain("$ 45.000");
    expect(html).toContain("5x Globo metálico");
    expect(html).toContain("Total: $ 115.000");
    expect(html).toContain("Calle 1 # 2-34, Chapinero, Bogotá, Apto 502");
  });

  it("omits the trailing extra segment when not provided", () => {
    const html = buildOrderReceivedEmail({
      customerName: "Ana",
      orderNumber: 1042,
      items: [{ name: "Piñata estrella", quantity: 1, unitPriceCop: 45000 }],
      totalCop: 45000,
      address: "Calle 1 # 2-34",
      neighborhood: "Chapinero",
      city: "Bogotá",
    });

    expect(html).toContain("Calle 1 # 2-34, Chapinero, Bogotá");
    expect(html).not.toContain("Bogotá,");
  });
});

describe("buildOrderShippedEmail", () => {
  it("includes customer name, carrier, and tracking number", () => {
    const html = buildOrderShippedEmail({
      customerName: "Ana",
      orderNumber: 1042,
      carrier: "Servientrega",
      trackingNumber: "SV123456789",
    });

    expect(html).toContain("#1042");
    expect(html).toContain("Ana");
    expect(html).toContain("Servientrega");
    expect(html).toContain("SV123456789");
  });
});
