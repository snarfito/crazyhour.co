import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { PUBLIC_THEME_CLASS } from "@/lib/theme";
import { getWhatsAppNumber } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp-message";
import { CartProvider } from "@/components/cart/cart-context";
import { CartIcon } from "@/components/cart/cart-icon";
import { Footer } from "@/components/catalog/footer";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const whatsappNumber = await getWhatsAppNumber();
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, "Hola, tengo una pregunta sobre sus productos.");

  return (
    <div data-testid="public-theme-root" className={`${PUBLIC_THEME_CLASS} min-h-screen bg-background text-foreground`}>
      <CartProvider>
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
          <Link href="/">
            <Image src="/logo.webp" alt="Crazy Hour" width={120} height={40} priority />
          </Link>
          <CartIcon />
        </header>
        <main className="font-body pb-24">{children}</main>
        <Footer whatsappNumber={whatsappNumber} />
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pedir por WhatsApp"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-whatsapp text-white shadow-lg transition-transform duration-150 ease-out hover:-translate-y-0.5"
        >
          <MessageCircle aria-hidden="true" className="h-7 w-7" />
        </a>
      </CartProvider>
    </div>
  );
}
