import type { Metadata, Viewport } from "next";
import { notoSans, notoSerif, playfair } from "./fonts";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ZAKOVAT ANDIJON — intellektual oʻyinlar va tadbirlar",
    template: "%s · ZAKOVAT ANDIJON",
  },
  description:
    "Zakovat Andijon — Andijondagi intellektual oʻyinlar va tadbirlar. Tadbirlar, sertifikatlar va sertifikatlarni QR kod orqali tekshirish.",
  icons: { icon: "/icon.svg" },
  openGraph: { type: "website", locale: "uz_UZ", siteName: "ZAKOVAT ANDIJON" },
};

export const viewport: Viewport = {
  themeColor: "#0f2044",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${playfair.variable} ${notoSans.variable} ${notoSerif.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
