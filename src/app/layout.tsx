import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { appUrl, env } from "@/lib/env";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "ByMaster — Profesyonel Pastacılık Ürünleri",
    template: "%s | ByMaster",
  },
  description:
    "Waffle sosları, çikolata bazları, pirinç patlakları, krep kırıkları ve evde tatlı kitleri. Profesyonel mutfaklar ve tatlı tutkunları için ByMaster pastacılık ürünleri.",
  applicationName: "ByMaster",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "ByMaster",
    images: [{ url: "/images/og-default.jpg", width: 1200, height: 630, alt: "ByMaster — Professional Pastry Products" }],
  },
  twitter: { card: "summary_large_image" },
  robots: env.NOINDEX ? { index: false, follow: false } : { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#351C16",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
