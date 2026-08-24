import { formatCOP } from "@/lib/format";

export function buildWhatsAppMessage({
  customerName,
  items,
  totalCop,
  address,
  city,
}: {
  customerName: string;
  items: { name: string; quantity: number; unitPriceCop: number }[];
  totalCop: number;
  address: string;
  city: string;
}): string {
  const lines = [
    `Hola, soy ${customerName} y quiero hacer este pedido:`,
    "",
    ...items.map((item) => `${item.quantity}x ${item.name} (${formatCOP(item.unitPriceCop)} c/u)`),
    "",
    `Total: ${formatCOP(totalCop)}`,
    "",
    `Dirección de envío: ${address}, ${city}`,
  ];
  return lines.join("\n");
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
