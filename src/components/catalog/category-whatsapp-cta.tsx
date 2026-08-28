import { buildWhatsAppUrl } from "@/lib/whatsapp-message";

export function CategoryWhatsAppCta({ whatsappNumber }: { whatsappNumber: string }) {
  const url = buildWhatsAppUrl(
    whatsappNumber,
    "Hola, no encontré lo que buscaba en el catálogo, ¿me ayudas?"
  );

  return (
    <section className="neon-border mt-10 flex flex-col items-center gap-4 rounded-2xl border border-brand-cyan/40 bg-card/55 px-4 py-6 text-center text-brand-cyan sm:flex-row sm:items-center sm:justify-between sm:text-left">
      <div className="text-foreground">
        <h3 className="font-heading text-lg font-extrabold">¿No encuentras lo que buscabas?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Mándanos la foto por WhatsApp y te decimos si lo tenemos en bodega.
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block shrink-0 rounded-lg bg-brand-whatsapp px-6 py-3 font-heading text-sm font-extrabold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
      >
        Escribir por WhatsApp
      </a>
    </section>
  );
}
