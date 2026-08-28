import type { Metadata } from "next";
import { fontHeading, fontBody, fontAccent, fontMono } from "@/lib/fonts";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Crazy Hour",
  description: "Piñatería y artículos de fiesta",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Crazy Hour",
    description: "Piñatería y artículos de fiesta",
    siteName: "Crazy Hour",
    url: SITE_URL,
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
      className={`${fontHeading.variable} ${fontBody.variable} ${fontAccent.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
