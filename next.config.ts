import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// İçerik Güvenlik Politikası (CSP)
// - Ödeme sağlayıcıları (PayTR iframe, iyzico yönlendirmesi) ve izinli analitik servisleri dışında
//   harici kaynak yüklenmez.
// - Next.js'in satır içi hydration betikleri nedeniyle script-src 'unsafe-inline' gereklidir;
//   uygulama hiçbir yerde güvenilmeyen HTML render etmez (React kaçışlama + ham HTML'siz Markdown).
const csp = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "https://www.paytr.com",
    "https://www.googletagmanager.com",
    "https://connect.facebook.net",
  ]
    .filter(Boolean)
    .join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com",
  "frame-src 'self' https://www.paytr.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://www.paytr.com https://*.iyzipay.com",
  "base-uri 'self'",
  "object-src 'none'",
  isDev ? "" : "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self "https://www.paytr.com")',
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 85],
    localPatterns: [{ pathname: "/images/**" }, { pathname: "/media/**" }],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/yonetim/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
    ];
  },
};

// GitHub Pages için statik vitrin (scripts/build-pages.mjs, NEXT_PUBLIC_STATIC_SITE=1): sunucusuz HTML çıktısı.
// Statik barındırmada başlık (headers) tanımlanamaz ve görsel optimizasyonu yoktur.
const staticSiteConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: { loader: "custom", loaderFile: "./src/lib/static-image-loader.ts" },
};

export default process.env.NEXT_PUBLIC_STATIC_SITE === "1" ? staticSiteConfig : nextConfig;
