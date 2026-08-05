import type { Metadata } from "next";
import { fontHeading, fontBody } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crazy Hour",
  description: "Piñatería y artículos de fiesta",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fontHeading.variable} ${fontBody.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
