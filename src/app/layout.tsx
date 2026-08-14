import type { Metadata } from "next";
import { fontHeading, fontBody, fontAccent } from "@/lib/fonts";
import "./globals.css";

// ponytail: hardcoded to the Vercel URL since crazyhour.co isn't registered yet — swap for https://crazyhour.co once DNS is cut over (CLAUDE.md Fase 6)
const siteUrl = "https://crazyhour.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Crazy Hour",
  description: "Piñatería y artículos de fiesta",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Crazy Hour",
    description: "Piñatería y artículos de fiesta",
    siteName: "Crazy Hour",
    url: siteUrl,
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crazy Hour",
    description: "Piñatería y artículos de fiesta",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fontHeading.variable} ${fontBody.variable} ${fontAccent.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
