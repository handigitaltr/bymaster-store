import type { Metadata } from "next";
import { QuoteForm } from "@/components/b2b/QuoteForm";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ACTIVE_PRODUCT } from "@/lib/catalog";
import { SORTED_TR_CITIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatWeight } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { LEGAL_PAGE_SLUGS } from "@/lib/settings";

export const metadata: Metadata = pageMetadata({
  title: "Toplu Alım Teklifi",
  description: "Kafe, pastane, restoran ve oteller için ByMaster ürünlerinde toplu alım teklifi isteyin. Ürün ve miktarları iletin, size dönüş yapalım.",
  path: "/profesyonel/teklif",
});

export default async function QuoteRequestPage({ searchParams }: { searchParams: Promise<{ urun?: string }> }) {
  const { urun } = await searchParams;
  const [variants, kvkk] = await Promise.all([
    db.productVariant.findMany({
      where: { isActive: true, product: { ...ACTIVE_PRODUCT } },
      select: { id: true, name: true, packageType: true, netWeightGrams: true, product: { select: { name: true, sortOrder: true } } },
      orderBy: [{ product: { sortOrder: "asc" } }],
    }),
    db.page.findFirst({ where: { slug: LEGAL_PAGE_SLUGS.kvkk, status: "PUBLISHED" }, select: { slug: true } }),
  ]);
  const options = variants.map((variant) => ({
    variantId: variant.id,
    label: `${variant.product.name} — ${formatWeight(variant.netWeightGrams) ?? variant.name}`,
    defaultUnit: variant.packageType === "KOVA" ? "KOVA" : variant.packageType === "KUTU" ? "ADET" : "PAKET",
  }));

  return (
    <div className="container-page pb-24 pt-8">
      <Breadcrumbs
        items={[
          { name: "Profesyonellere Özel", path: "/profesyonel" },
          { name: "Toplu alım teklifi", path: "/profesyonel/teklif" },
        ]}
      />
      <div className="mt-8 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="eyebrow">B2B · Toplu alım</p>
          <h1 className="display-lg mt-3 text-cocoa-900">Teklif isteyin</h1>
          <p className="mt-4 text-cocoa-600">
            İhtiyaç duyduğunuz ürünleri ve miktarları iletin. Talebiniz kayıt altına alınır, ekibimiz değerlendirerek size e-posta veya
            telefonla dönüş yapar.
          </p>
          <ol className="mt-8 space-y-4">
            {["Ürün ve miktarları seçin", "İşletme ve iletişim bilgilerinizi girin", "Referans numaranızla talebiniz kaydedilir; size dönüş yapılır"].map(
              (step, index) => (
                <li key={step} className="flex gap-3 text-sm text-cocoa-700">
                  <span className="grid size-7 flex-none place-content-center rounded-full bg-cocoa-800 text-xs font-bold text-cream-50">{index + 1}</span>
                  <span className="pt-1">{step}</span>
                </li>
              ),
            )}
          </ol>
        </div>
        <div className="lg:col-span-8">
          <QuoteForm
            options={options}
            initialVariantId={urun && /^[a-z0-9]{10,40}$/i.test(urun) ? urun : null}
            kvkkHref={kvkk ? `/sayfa/${kvkk.slug}` : null}
            cities={[...SORTED_TR_CITIES]}
          />
        </div>
      </div>
    </div>
  );
}
