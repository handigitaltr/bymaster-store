import { CartProvider } from "@/components/cart/CartProvider";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { CookieConsent } from "@/components/site/CookieConsent";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { db } from "@/lib/db";
import { showTestModeBanner } from "@/lib/payments/config";
import { getSettings, LEGAL_PAGE_SLUGS } from "@/lib/settings";
import { STATIC_SITE } from "@/lib/site-mode";

async function getActiveAnnouncements() {
  const now = new Date();
  const rows = await db.announcement.findMany({
    where: {
      isActive: true,
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { sortOrder: "asc" },
    select: { id: true, message: true, linkUrl: true, linkLabel: true },
  });
  return rows;
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [announcements, settings, cookiePolicy] = await Promise.all([
    getActiveAnnouncements(),
    getSettings(),
    db.page.findFirst({ where: { slug: LEGAL_PAGE_SLUGS.cookies, status: "PUBLISHED" }, select: { slug: true } }),
  ]);

  return (
    <CartProvider>
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-cocoa-900 focus:px-4 focus:py-2 focus:text-cream-50"
      >
        İçeriğe geç
      </a>
      {showTestModeBanner() ? (
        <div className="bg-bordeaux-700 py-1.5 text-center text-xs font-bold tracking-wide text-white">
          TEST MODU — Bu sitedeki ödemeler gerçek değildir ve tahsilat yapılmaz.
        </div>
      ) : null}
      {/* Duyurular sipariş ve kargo kampanyalarıyla ilgilidir; statik vitrinde sipariş alınmadığı için gösterilmez */}
      {STATIC_SITE ? null : <AnnouncementBar items={announcements} />}
      <SiteHeader />
      <main id="icerik" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter />
      <CookieConsent
        gaMeasurementId={settings.gaMeasurementId}
        metaPixelId={settings.metaPixelId}
        policyHref={cookiePolicy ? `/sayfa/${cookiePolicy.slug}` : null}
      />
    </CartProvider>
  );
}
