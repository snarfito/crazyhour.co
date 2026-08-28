import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp-message";

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M16.6 5.82c-.9-.98-1.4-2.26-1.4-3.57h-3.03v13.9a3.05 3.05 0 1 1-2.1-2.9v-3.13a6.1 6.1 0 1 0 5.13 6.03V9.4a8.14 8.14 0 0 0 4.4 1.29V7.66c-1.09 0-2.1-.34-2.9-1.05Z" />
    </svg>
  );
}

function MercadoLibreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4">
      <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M17.2 6.8h.01" strokeLinecap="round" />
    </svg>
  );
}

export function Footer({ whatsappNumber }: { whatsappNumber: string }) {
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, "Hola, tengo una pregunta sobre sus productos.");
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL;
  const mercadoLibreUrl = process.env.NEXT_PUBLIC_MERCADOLIBRE_URL;
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL;

  return (
    <footer className="mt-10 border-t border-border px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-6">
        <div>
          <p className="text-glow font-heading text-lg font-extrabold">Crazy Hour</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Importador y distribuidor de artículos de fiesta y piñatería. Bogotá, Colombia.
          </p>
        </div>
        <div>
          <h6 className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Contacto
          </h6>
          <div className="mt-3 flex flex-col gap-3 text-sm">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-brand-whatsapp text-brand-whatsapp [box-shadow:0_0_10px_rgba(37,211,102,.7)]">
                <MessageCircle aria-hidden="true" className="h-4 w-4" />
              </span>
              WhatsApp
            </a>
            {tiktokUrl && (
              <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5">
                <span className="neon-border flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-brand-cyan text-brand-cyan">
                  <TikTokIcon />
                </span>
                TikTok
              </a>
            )}
            {mercadoLibreUrl && (
              <a
                href={mercadoLibreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5"
              >
                <span className="neon-border flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-brand-yellow text-brand-yellow">
                  <MercadoLibreIcon />
                </span>
                Mercado Libre
              </a>
            )}
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5">
                <span className="neon-border flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-brand-orange text-brand-orange">
                  <InstagramIcon />
                </span>
                Instagram
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
