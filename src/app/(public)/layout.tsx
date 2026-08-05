import Image from "next/image";
import { PUBLIC_THEME_CLASS } from "@/lib/theme";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-testid="public-theme-root" className={`${PUBLIC_THEME_CLASS} min-h-screen bg-background text-foreground`}>
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Image src="/logo.webp" alt="Crazy Hour" width={120} height={40} priority />
      </header>
      <main className="font-body">{children}</main>
    </div>
  );
}
