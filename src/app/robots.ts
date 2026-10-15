import type { MetadataRoute } from "next";
import { absoluteUrl, env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (env.NOINDEX) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/yonetim", "/api/", "/hesabim", "/sepet", "/odeme", "/siparis", "/giris", "/kayit", "/sifre", "/arama", "/favoriler", "/karsilastir", "/bulten"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
