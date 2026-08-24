import { describe, it, expect } from "vitest";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "./whatsapp-message";

describe("buildWhatsAppMessage", () => {
  it("lists items with quantity and unit price, and a total", () => {
    const message = buildWhatsAppMessage({
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
    });

    expect(message).toContain("Pedido #1042");
    expect(message).toContain("Ana");
    expect(message).toContain("2x Piñata estrella ($ 45.000 c/u)");
    expect(message).toContain("5x Globo metálico ($ 5.000 c/u)");
    expect(message).toContain("Total: $ 115.000");
  });

  it("includes the shipping address with neighborhood and city", () => {
    const message = buildWhatsAppMessage({
      customerName: "Ana",
      orderNumber: 1042,
      items: [{ name: "Piñata estrella", quantity: 2, unitPriceCop: 45000 }],
      totalCop: 90000,
      address: "Calle 1 # 2-34",
      neighborhood: "Chapinero",
      city: "Bogotá",
    });

    expect(message).toContain("Dirección de envío: Calle 1 # 2-34, Chapinero, Bogotá");
  });

  it("includes additional info when provided", () => {
    const message = buildWhatsAppMessage({
      customerName: "Ana",
      orderNumber: 1042,
      items: [{ name: "Piñata estrella", quantity: 2, unitPriceCop: 45000 }],
      totalCop: 90000,
      address: "Calle 1 # 2-34",
      neighborhood: "Chapinero",
      city: "Bogotá",
      extra: "Apto 502, torre 3",
    });

    expect(message).toContain("Información adicional: Apto 502, torre 3");
  });

  it("omits the additional info line when not provided", () => {
    const message = buildWhatsAppMessage({
      customerName: "Ana",
      orderNumber: 1042,
      items: [{ name: "Piñata estrella", quantity: 2, unitPriceCop: 45000 }],
      totalCop: 90000,
      address: "Calle 1 # 2-34",
      neighborhood: "Chapinero",
      city: "Bogotá",
      extra: "",
    });

    expect(message).not.toContain("Información adicional");
  });
});

describe("buildWhatsAppUrl", () => {
  it("builds a wa.me link with the message URL-encoded", () => {
    const url = buildWhatsAppUrl("573001234567", "Hola, ¿tienen piñatas?");

    expect(url).toBe("https://wa.me/573001234567?text=Hola%2C%20%C2%BFtienen%20pi%C3%B1atas%3F");
  });
});
