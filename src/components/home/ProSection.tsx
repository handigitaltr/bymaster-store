import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatTRY } from "@/lib/money";
import { STATIC_SITE } from "@/lib/site-mode";

export type PackagingRow = {
  categorySlug: string;
  label: string;
  format: string;
  minPriceKurus: number;
  maxPriceKurus: number;
  productCount: number;
};

export function ProSection({ rows }: { rows: PackagingRow[] }) {
  return (
    <section className="relative overflow-hidden bg-cocoa-900 text-cream-100" aria-labelledby="pro-baslik">
      <div aria-hidden="true" className="waffle-grid absolute inset-0" />
      <div className="container-page relative grid gap-14 py-20 lg:grid-cols-12 lg:gap-10 lg:py-28">
        <div className="lg:col-span-5">
          <p className="eyebrow eyebrow-light mb-4">Profesyonellere özel</p>
          <h2 id="pro-baslik" className="display-lg text-cream-50">
            Mutfağınız İçin Profesyonel Çözümler.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-cream-300">
            Kafelerden pastanelere, yoğun üretim yapan mutfaklardan yeni girişimlere kadar ihtiyaçlarınıza uygun ürünleri keşfedin.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/profesyonel" className="btn btn-lg btn-light group">
              Profesyonel Ürünleri İncele
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            {STATIC_SITE ? null : (
              <Link href="/profesyonel/teklif" className="btn btn-lg btn-outline-light">
                Toptan Satış İçin İletişime Geç
              </Link>
            )}
          </div>
          <div className="relative mt-12 hidden aspect-[16/10] overflow-hidden rounded-[1.4rem] lg:block">
            <Image
              src="/images/editorial/profesyonel-bubble.jpg"
              alt="Vitrinde sergilenen süslemeli bubble waffle'lar"
              fill
              sizes="36vw"
              className="object-cover opacity-90"
            />
            <span className="absolute bottom-3 right-4 text-[0.62rem] font-semibold text-white/80">Temsili sunum fotoğrafı</span>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="rounded-[1.6rem] border border-cream-50/12 bg-cocoa-950/50 p-6 backdrop-blur-sm sm:p-8">
            <div className="flex items-baseline justify-between gap-4 border-b border-cream-50/12 pb-5">
              <p className="font-display text-2xl text-cream-50">Ambalaj rehberi</p>
              <p className="text-xs font-semibold text-cream-300">Güncel liste fiyatları · KDV dahil</p>
            </div>
            <ul className="divide-y divide-cream-50/10">
              {rows.map((row) => (
                <li key={row.categorySlug}>
                  <Link
                    href={`/kategori/${row.categorySlug}`}
                    className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-5 sm:grid-cols-[1.3fr_1fr_auto]"
                  >
                    <span className="font-display text-xl text-cream-50 group-hover:text-caramel-300">{row.label}</span>
                    <span className="order-3 col-span-2 text-sm text-cream-300 sm:order-none sm:col-span-1">
                      {row.format} · {row.productCount} çeşit
                    </span>
                    <span className="text-right text-sm font-bold tabular-nums text-cream-100">
                      {row.minPriceKurus === row.maxPriceKurus
                        ? formatTRY(row.minPriceKurus)
                        : `${formatTRY(row.minPriceKurus)} – ${formatTRY(row.maxPriceKurus)}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-cream-50/12 pt-5 text-sm leading-relaxed text-cream-300">
              Düzenli ve yüksek hacimli alımlar için ihtiyaç duyduğunuz ürün ve miktarları iletin; talebiniz değerlendirilerek size
              dönüş yapılır. Toplu alım koşulları teklif aşamasında netleşir.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
