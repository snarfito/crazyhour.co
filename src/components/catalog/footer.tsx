import { buildWhatsAppUrl } from "@/lib/whatsapp-message";

export function Footer({ whatsappNumber }: { whatsappNumber: string }) {
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, "Hola, tengo una pregunta sobre sus productos.");
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL;
  const mercadoLibreUrl = process.env.NEXT_PUBLIC_MERCADOLIBRE_URL;

  return (
    <footer className="mt-10 border-t border-border px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-6">
        <div>
          <p className="font-heading text-lg font-extrabold">Crazy Hour</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Importador y distribuidor de artículos de fiesta y piñatería. Bogotá, Colombia.
          </p>
        </div>
        <div>
          <h6 className="font-heading text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Contacto
          </h6>
          <div className="mt-2 flex flex-col gap-1.5 text-sm">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              WhatsApp
            </a>
            {tiktokUrl && (
              <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                TikTok
              </a>
            )}
            {mercadoLibreUrl && (
              <a href={mercadoLibreUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Mercado Libre
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
