import Image from "next/image";
import { ShoppingCart, MessageCircle } from "lucide-react";
import { PUBLIC_THEME_CLASS } from "@/lib/theme";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-testid="public-theme-root" className={`${PUBLIC_THEME_CLASS} min-h-screen bg-background text-foreground`}>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <Image src="/logo.webp" alt="Crazy Hour" width={120} height={40} priority />
        <ShoppingCart aria-label="Carrito" className="h-5 w-5 text-muted-foreground" />
      </header>
      <main className="font-body pb-24">{children}</main>
      <button
        type="button"
        aria-label="Pedir por WhatsApp"
        aria-disabled="true"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-whatsapp text-white shadow-lg transition-transform duration-150 ease-out hover:-translate-y-0.5"
      >
        <MessageCircle aria-hidden="true" className="h-7 w-7" />
      </button>
    </div>
  );
}
