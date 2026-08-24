import "server-only";
import { createResendClient } from "@/lib/resend";
import { getSettings } from "@/lib/settings";
import { formatCOP } from "@/lib/format";

const FROM = "Crazy Hour <pedidos@crazyhour.co>";

function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="background:#f5f9fc;padding:24px;font-family:sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
        <div style="background:#1C4170;padding:20px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:20px;">Crazy Hour</h1>
        </div>
        <div style="padding:24px;color:#16232E;">
          <h2 style="margin-top:0;">${title}</h2>
          ${bodyHtml}
        </div>
      </div>
    </div>
  `;
}

export function buildOrderReceivedEmail({
  customerName,
  items,
  totalCop,
  address,
  neighborhood,
  city,
  extra,
}: {
  customerName: string;
  items: { name: string; quantity: number; unitPriceCop: number }[];
  totalCop: number;
  address: string;
  neighborhood: string;
  city: string;
  extra?: string;
}): string {
  const itemsHtml = items
    .map((item) => `<li>${item.quantity}x ${item.name} (${formatCOP(item.unitPriceCop)} c/u)</li>`)
    .join("");
  const fullAddress = `${address}, ${neighborhood}, ${city}${extra ? `, ${extra}` : ""}`;

  return emailShell(
    "¡Gracias por tu pedido!",
    `
      <p>Hola ${customerName}, recibimos tu pedido con estos productos:</p>
      <ul>${itemsHtml}</ul>
      <p style="color:#FC6000;font-weight:bold;">Total: ${formatCOP(totalCop)}</p>
      <p>Dirección de envío: ${fullAddress}</p>
    `
  );
}

export function buildOrderShippedEmail({
  customerName,
  carrier,
  trackingNumber,
}: {
  customerName: string;
  carrier: string;
  trackingNumber: string;
}): string {
  return emailShell(
    "¡Tu pedido va en camino!",
    `
      <p>Hola ${customerName}, tu pedido fue despachado.</p>
      <p>Transportadora: ${carrier}</p>
      <p>Número de guía: ${trackingNumber}</p>
    `
  );
}

export async function sendOrderReceivedEmail(params: {
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; unitPriceCop: number }[];
  totalCop: number;
  address: string;
  neighborhood: string;
  city: string;
  extra?: string;
}) {
  try {
    const { contactEmail } = await getSettings();
    const resend = createResendClient();
    await resend.emails.send({
      from: FROM,
      to: params.customerEmail,
      replyTo: contactEmail || undefined,
      subject: "Recibimos tu pedido — Crazy Hour",
      html: buildOrderReceivedEmail(params),
    });
  } catch (error) {
    console.error("[resend]", error);
  }
}

export async function sendOrderShippedEmail(params: { customerName: string; customerEmail: string; carrier: string; trackingNumber: string }) {
  try {
    const { contactEmail } = await getSettings();
    const resend = createResendClient();
    await resend.emails.send({
      from: FROM,
      to: params.customerEmail,
      replyTo: contactEmail || undefined,
      subject: "Tu pedido va en camino — Crazy Hour",
      html: buildOrderShippedEmail(params),
    });
  } catch (error) {
    console.error("[resend]", error);
  }
}
