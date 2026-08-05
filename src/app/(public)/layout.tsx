import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { PUBLIC_THEME_CLASS } from "@/lib/theme";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-testid="public-theme-root" className={`${PUBLIC_THEME_CLASS} min-h-screen bg-background text-foreground`}>
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Image src="/logo.webp" alt="Crazy Hour" width={120} height={40} priority />
        <ShoppingCart aria-label="Carrito" className="h-5 w-5 text-muted-foreground" />
      </header>
      <main className="font-body">{children}</main>
    </div>
  );
}
