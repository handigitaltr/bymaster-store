import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { InstagramIcon } from "@/components/brand/SocialIcons";
import { db } from "@/lib/db";
import { getActiveCategories } from "@/lib/catalog";
import { getSettings, LEGAL_PAGE_SLUGS } from "@/lib/settings";
import { STATIC_SITE } from "@/lib/site-mode";
import { formatPhoneForDisplay } from "@/lib/text";
import { CookiePreferencesButton } from "./CookieConsent";
import { NewsletterForm } from "./NewsletterForm";

export async function SiteFooter() {
  const [settings, categories, publishedPages] = await Promise.all([
    getSettings(),
    getActiveCategories(),
    db.page.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, title: true } }),
  ]);
  const pageHref = (slug: string) => (publishedPages.some((page) => page.slug === slug) ? `/sayfa/${slug}` : null);
  const legalCandidates: Array<{ slug: string; label: string }> = [
    { slug: LEGAL_PAGE_SLUGS.kvkk, label: "KVKK Aydınlatma Metni" },
    { slug: LEGAL_PAGE_SLUGS.privacy, label: "Gizlilik Politikası" },
    { slug: LEGAL_PAGE_SLUGS.cookies, label: "Çerez Politikası" },
    { slug: LEGAL_PAGE_SLUGS.distanceSales, label: "Mesafeli Satış Sözleşmesi" },
    { slug: LEGAL_PAGE_SLUGS.preInformation, label: "Ön Bilgilendirme Formu" },
  ];
  const legalLinks = legalCandidates.flatMap((link) => {
    const href = pageHref(link.slug);
    return href ? [{ ...link, href }] : [];
  });

  const helpLinks = [
    { href: "/sss", label: "Sıkça Sorulan Sorular" },
    { href: pageHref(LEGAL_PAGE_SLUGS.shipping), label: "Kargo ve Teslimat" },
    { href: pageHref(LEGAL_PAGE_SLUGS.returns), label: "İade ve İptal" },
    // Statik vitrinde sipariş takibi ve iletişim formu (sunucu gerektirir) yoktur
    { href: STATIC_SITE ? null : "/siparis-takip", label: "Sipariş Takibi" },
    { href: STATIC_SITE ? null : "/iletisim", label: "İletişim" },
  ].filter((link): link is { href: string; label: string } => Boolean(link.href));

  const hasOptionalCookies = Boolean(settings.gaMeasurementId || settings.metaPixelId);
  const year = new Date().getFullYear();

  return (
    <footer className="grain bg-cocoa-950 text-cream-200">
      <div className="container-page relative">
        {STATIC_SITE ? null : (
          <section aria-labelledby="newsletter-title" className="grid gap-8 border-b border-cream-50/10 py-14 lg:grid-cols-12 lg:items-center lg:py-16">
            <div className="lg:col-span-5">
              <p className="eyebrow eyebrow-light mb-3">Lezzet Günlüğü bülteni</p>
              <h2 id="newsletter-title" className="display-md text-cream-50">
                Yeni tarifler, sunum fikirleri ve kampanyalar e-postanızda.
              </h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <NewsletterForm kvkkHref={pageHref(LEGAL_PAGE_SLUGS.kvkk)} />
            </div>
          </section>
        )}

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block text-cream-50" aria-label="ByMaster ana sayfa">
              <Logo className="w-44" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream-300">
              Waffle, krep, pankek ve tatlı sunumları için profesyonel pastacılık ürünleri. Kafeler, pastaneler ve evde tatlı
              hazırlamayı sevenler için.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {settings.companyPhone ? (
                <li className="flex items-center gap-2.5">
                  <Phone className="size-4 text-caramel-400" aria-hidden="true" />
                  <a href={`tel:${settings.companyPhone.replace(/\s/g, "")}`} className="hover:text-cream-50">
                    {formatPhoneForDisplay(settings.companyPhone)}
                  </a>
                </li>
              ) : null}
              {settings.companyEmail ? (
                <li className="flex items-center gap-2.5">
                  <Mail className="size-4 text-caramel-400" aria-hidden="true" />
                  <a href={`mailto:${settings.companyEmail}`} className="hover:text-cream-50">
                    {settings.companyEmail}
                  </a>
                </li>
              ) : null}
              {settings.companyAddress ? (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 flex-none text-caramel-400" aria-hidden="true" />
                  <span>{settings.companyAddress}</span>
                </li>
              ) : null}
            </ul>
            {settings.instagramUrl ? (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-cream-50/15 px-4 py-2 text-sm font-semibold hover:border-cream-50/40 hover:text-cream-50"
              >
                <InstagramIcon className="size-4" /> Instagram
              </a>
            ) : null}
          </div>

          <nav aria-label="Ürün kategorileri" className="lg:col-span-3">
            <p className="eyebrow eyebrow-light mb-4">Ürünler</p>
            <ul className="space-y-2.5 text-sm">
              {categories
                .filter((category) => category._count.products > 0)
                .map((category) => (
                  <li key={category.slug}>
                    <Link href={`/kategori/${category.slug}`} className="link-reveal hover:text-cream-50">
                      {category.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>

          <nav aria-label="Keşfet" className="lg:col-span-2">
            <p className="eyebrow eyebrow-light mb-4">Keşfet</p>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/tarifler", label: "Tarifler ve İlham" },
                { href: "/lezzet-dunyasi", label: "Waffle & Tatlı Dünyası" },
                { href: "/profesyonel", label: "Profesyonellere Özel" },
                ...(STATIC_SITE ? [] : [{ href: "/profesyonel/teklif", label: "Toplu Alım Teklifi" }]),
                { href: "/hakkimizda", label: "Hakkımızda" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-reveal hover:text-cream-50">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Yardım ve yasal" className="lg:col-span-3">
            <p className="eyebrow eyebrow-light mb-4">Yardım</p>
            <ul className="space-y-2.5 text-sm">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-reveal hover:text-cream-50">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            {legalLinks.length > 0 ? (
              <>
                <p className="eyebrow eyebrow-light mb-4 mt-8">Yasal</p>
                <ul className="space-y-2.5 text-sm">
                  {legalLinks.map((link) => (
                    <li key={link.slug}>
                      <Link href={link.href} className="link-reveal hover:text-cream-50">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-cream-50/10 py-6 text-xs text-cream-300/80 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.companyLegalName ?? settings.storeName}. Tüm hakları saklıdır.
            {settings.companyMersis ? ` · MERSİS: ${settings.companyMersis}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {settings.etbisUrl ? (
              <a href={settings.etbisUrl} target="_blank" rel="noopener noreferrer" className="hover:text-cream-50">
                ETBİS kaydı
              </a>
            ) : null}
            {hasOptionalCookies ? <CookiePreferencesButton className="hover:text-cream-50" /> : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
