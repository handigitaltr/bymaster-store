import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, ChefHat, Coffee, Hotel, Rocket, Store } from "lucide-react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { PortionCalculator } from "@/components/product/PortionCalculator";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { isPurchasable, variantAvailability } from "@/lib/availability";
import { ACTIVE_PRODUCT } from "@/lib/catalog";
import { PACKAGE_TYPE_LABELS, type PackageType } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatTRY, formatWeight, unitPricePerKg } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { STATIC_SITE } from "@/lib/site-mode";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: "Profesyonellere Özel — Ambalaj, Fiyat ve Toplu Alım",
  description:
    "Kafe, pastane, restoran ve oteller için ByMaster: 10 kg kova soslar, 2,5 kg krep kırıkları, 1 kg pirinç patlakları. Ambalaj ve fiyat karşılaştırması, porsiyon hesaplayıcı ve toplu alım teklifi.",
  path: "/profesyonel",
  image: "/images/editorial/profesyonel-bubble.jpg",
});

const AUDIENCES = [
  { icon: Coffee, title: "Kafeler", text: "Waffle, krep ve dondurma menüleri için soslar ve süslemeler." },
  { icon: Store, title: "Pastaneler", text: "Pasta, kek ve tatlı süslemesinde renk ve doku seçenekleri." },
  { icon: ChefHat, title: "Restoranlar", text: "Tatlı menüsünü tamamlayan sunum ürünleri." },
  { icon: Hotel, title: "Oteller", text: "Kahvaltı büfeleri ve tatlı istasyonları için kova ambalajlar." },
  { icon: Building2, title: "Tatlı üreticileri", text: "Düzenli kullanım için ambalaj ve miktar seçenekleri." },
  { icon: Rocket, title: "Yeni girişimler", text: "Menü planlaması için porsiyon ve maliyet hesabı." },
];

export default async function ProfessionalPage() {
  const products = await db.product.findMany({
    where: { ...ACTIVE_PRODUCT, kind: "SIMPLE" },
    orderBy: [{ primaryCategory: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      saleStatus: true,
      primaryCategory: { select: { name: true, slug: true } },
      variants: {
        where: { isActive: true },
        orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          name: true,
          packageType: true,
          netWeightGrams: true,
          unitsPerCase: true,
          priceKurus: true,
          trackStock: true,
          stock: true,
          lowStockThreshold: true,
          minOrderQty: true,
          maxOrderQty: true,
          servingGrams: true,
        },
      },
    },
  });

  const groups = new Map<string, { name: string; slug: string; rows: typeof products }>();
  for (const product of products) {
    const key = product.primaryCategory.slug;
    if (!groups.has(key)) groups.set(key, { name: product.primaryCategory.name, slug: key, rows: [] });
    groups.get(key)!.rows.push(product);
  }

  const calculatorOptions = products.flatMap((product) =>
    product.variants
      .filter((variant) => variant.netWeightGrams && variant.priceKurus > 0)
      .map((variant) => ({
        variantId: variant.id,
        label: product.name,
        netWeightGrams: variant.netWeightGrams as number,
        priceKurus: variant.priceKurus,
        servingGrams: variant.servingGrams,
        purchasable: isPurchasable(variantAvailability(variant, product.saleStatus)),
        packageLabel: `${formatWeight(variant.netWeightGrams)} ${variant.packageType === "KOVA" ? "kova" : "paket"}`,
      })),
  );

  return (
    <div>
      <section className="relative overflow-hidden bg-cocoa-900 text-cream-50">
        <div aria-hidden="true" className="waffle-grid absolute inset-0" />
        <div className="container-page relative grid gap-12 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <p className="eyebrow eyebrow-light">Profesyonellere özel</p>
            <h1 className="display-xl mt-5">Mutfağınız İçin Profesyonel Çözümler.</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream-200">
              Kafelerden pastanelere, yoğun üretim yapan mutfaklardan yeni girişimlere kadar ihtiyaçlarınıza uygun ürünleri keşfedin.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {STATIC_SITE ? (
                <p className="w-full text-sm font-semibold text-caramel-300">Toplu alım teklif formu, online sipariş sistemiyle birlikte açılacak.</p>
              ) : (
                <Link href="/profesyonel/teklif" className="btn btn-lg btn-light">
                  Toplu alım teklifi iste <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              )}
              <a href="#ambalaj-tablosu" className="btn btn-lg btn-outline-light">
                Ambalaj ve fiyatlar
              </a>
            </div>
          </div>
          <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[1.8rem] lg:col-span-5 lg:block">
            <Image src="/images/editorial/profesyonel-sef.jpg" alt="Profesyonel mutfakta servis hazırlığı yapan şef" fill priority sizes="38vw" className="object-cover" />
            <span className="absolute bottom-3 right-4 text-[0.62rem] font-semibold text-white/85">Temsili fotoğraf</span>
          </div>
        </div>
      </section>

      <section className="bg-cream-50 py-20" aria-labelledby="kimler">
        <div className="container-page">
          <h2 id="kimler" className="display-md text-cocoa-900">
            Kimler için?
          </h2>
          <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((item) => (
              <li key={item.title} className="flex gap-4">
                <item.icon className="size-7 flex-none text-caramel-700" strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <p className="font-display text-xl text-cocoa-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-cocoa-600">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="ambalaj-tablosu" className="scroll-mt-24 bg-cream-200 py-20" aria-labelledby="tablo-baslik">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Ambalaj ve fiyat karşılaştırması</p>
            <h2 id="tablo-baslik" className="display-md mt-3 text-cocoa-900">
              Net miktarlar, güncel fiyatlar, kilogram fiyatları.
            </h2>
            <p className="mt-3 text-cocoa-600">Tüm fiyatlar KDV dahil güncel liste fiyatlarıdır. Toplu alım koşulları teklif aşamasında netleşir.</p>
          </div>
          <div className="mt-10 space-y-10">
            {Array.from(groups.values()).map((group) => (
              <div key={group.slug}>
                <h3 className="font-display text-2xl text-cocoa-900">
                  <Link href={`/kategori/${group.slug}`} className="link-reveal">
                    {group.name}
                  </Link>
                </h3>
                <div className="relative mt-4 overflow-x-auto rounded-[1.2rem] border border-cocoa-800/10 bg-cream-50">
                  <table className="w-full min-w-[46rem] text-left text-sm">
                    <thead className="bg-cream-100 text-xs uppercase tracking-wider text-cocoa-500">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-bold">Ürün</th>
                        <th scope="col" className="px-4 py-3 font-bold">Ambalaj</th>
                        <th scope="col" className="px-4 py-3 font-bold">Koli içi</th>
                        <th scope="col" className="px-4 py-3 text-right font-bold">Fiyat</th>
                        <th scope="col" className="px-4 py-3 text-right font-bold">Kilogram fiyatı</th>
                        <th scope="col" className="px-4 py-3 font-bold">Durum</th>
                        {STATIC_SITE ? null : (
                          <th scope="col" className="px-4 py-3">
                            <span className="sr-only">İşlem</span>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cocoa-800/8">
                      {group.rows.flatMap((product) =>
                        product.variants.map((variant) => {
                          const availability = variantAvailability(variant, product.saleStatus);
                          const perKg = unitPricePerKg(variant.priceKurus, variant.netWeightGrams);
                          return (
                            <tr key={variant.id}>
                              <td className="px-4 py-3">
                                <Link href={`/urun/${product.slug}`} className="font-bold text-cocoa-900 hover:text-bordeaux-600">
                                  {product.name}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-cocoa-700">
                                {PACKAGE_TYPE_LABELS[variant.packageType as PackageType] ?? variant.packageType} · {formatWeight(variant.netWeightGrams) ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-cocoa-700">{variant.unitsPerCase ? `${variant.unitsPerCase} adet` : "—"}</td>
                              <td className="px-4 py-3 text-right font-bold tabular-nums">{variant.priceKurus > 0 ? formatTRY(variant.priceKurus) : "—"}</td>
                              <td className="px-4 py-3 text-right tabular-nums text-cocoa-600">{perKg ? formatTRY(perKg) : "—"}</td>
                              <td className="px-4 py-3">
                                <AvailabilityBadge availability={availability} />
                              </td>
                              {STATIC_SITE ? null : (
                                <td className="w-36 px-4 py-2">
                                  {isPurchasable(availability) && variant.priceKurus > 0 ? (
                                    <AddToCartButton appearance="compact" variantId={variant.id} quantity={variant.minOrderQty} productName={product.name} priceKurus={variant.priceKurus} label="Ekle" />
                                  ) : null}
                                </td>
                              )}
                            </tr>
                          );
                        }),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream-50 py-20" aria-label="Porsiyon hesaplayıcı">
        <div className="container-page">
          <PortionCalculator options={calculatorOptions} title="Profesyonel porsiyon hesaplayıcı" />
        </div>
      </section>

      {STATIC_SITE ? null : (
        <section className="bg-cocoa-800 py-16 text-cream-50">
          <div className="container-page flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-display text-3xl">Düzenli alımlar için teklif alın.</p>
              <p className="mt-2 max-w-xl text-cream-300">
                Ürün ve miktarlarınızı iletin; talebiniz değerlendirilerek size dönüş yapılsın. Kayıtlı işletme hesaplarına özel fiyat listesi
                tanımlanabilir; özel fiyatlar giriş yaptığınızda sepette uygulanır.
              </p>
            </div>
            <Link href="/profesyonel/teklif" className="btn btn-lg btn-light flex-none">
              Teklif formu <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
