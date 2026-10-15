import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlavorMap } from "@/components/world/FlavorMap";
import { PresentationLab } from "@/components/world/PresentationLab";
import { ACTIVE_PRODUCT, getTags, productCardSelect, toProductCard } from "@/lib/catalog";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: "Waffle & Tatlı Dünyası — Sunum Laboratuvarı ve Lezzet Haritası",
  description:
    "Waffle, pankek, krep, churros ve dondurma sunumları için sos ve süsleme kombinasyonlarını deneyin; lezzet haritasıyla ürünleri lezzet ailesine göre keşfedin.",
  path: "/lezzet-dunyasi",
  image: "/images/editorial/waffle-cikolata-sos.jpg",
});

export default async function FlavorWorldPage() {
  const [records, flavors, usages] = await Promise.all([
    db.product.findMany({ where: ACTIVE_PRODUCT, select: productCardSelect, orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }] }),
    getTags("FLAVOR"),
    getTags("USAGE"),
  ]);
  const products = records.map(toProductCard);

  return (
    <div>
      <section className="relative overflow-hidden bg-cocoa-900 text-cream-50">
        <Image src="/images/editorial/waffle-cikolata-sos.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-35" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-cocoa-950 via-cocoa-950/75 to-transparent" />
        <div className="container-page relative py-20 lg:py-28">
          <p className="eyebrow eyebrow-light">Waffle & Tatlı Dünyası</p>
          <h1 className="display-xl mt-5 max-w-3xl">
            Her tabak, <span className="italic text-caramel-300">bir kombinasyon</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream-200">
            Tatlınızı seçin, sosunu ve süslemesini deneyin; ya da lezzet haritasında ailelere göre gezinin. Beğendiğiniz kombinasyonu tek tıkla
            sepetinize ekleyin.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#sunum-laboratuvari" className="btn btn-lg btn-light">
              Sunum laboratuvarı
            </a>
            <a href="#lezzet-haritasi" className="btn btn-lg btn-outline-light">
              Lezzet haritası
            </a>
          </div>
        </div>
      </section>

      <section id="sunum-laboratuvari" className="scroll-mt-24 bg-cream-200 py-20 lg:py-28" aria-labelledby="lab-baslik">
        <div className="container-page">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow">01 — Sunum laboratuvarı</p>
            <h2 id="lab-baslik" className="display-lg mt-3 text-cocoa-900">
              Tatlınızı seçin, kombinasyonu kurun.
            </h2>
            <p className="mt-4 text-lg text-cocoa-600">Önerilen ürünler, seçtiğiniz tatlının kullanım alanına göre listelenir.</p>
          </div>
          <PresentationLab products={products} />
        </div>
      </section>

      <section id="lezzet-haritasi" className="scroll-mt-24 bg-cream-50 py-20 lg:py-28" aria-labelledby="harita-baslik">
        <div className="container-page">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow">02 — Lezzet haritası</p>
            <h2 id="harita-baslik" className="display-lg mt-3 text-cocoa-900">
              Lezzet ailesine göre keşfedin.
            </h2>
            <p className="mt-4 text-lg text-cocoa-600">
              Çikolatadan kuruyemişe, meyveden bisküvi ve karamele: soslar ve süslemeler aynı lezzet ailelerinde buluşur.
            </p>
          </div>
          <FlavorMap
            families={flavors.map((f) => ({ slug: f.slug, name: f.name, color: f.color, description: f.description }))}
            usages={usages.map((u) => ({ slug: u.slug, name: u.name }))}
            products={products}
          />
        </div>
      </section>

      <section className="bg-cream-200 py-16" aria-label="Kullanım alanlarına göre ürünler">
        <div className="container-page flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="font-display text-3xl text-cocoa-900">Kullanım alanına göre doğrudan gezin</p>
          <ul className="flex flex-wrap gap-2">
            {usages.map((usage) => (
              <li key={usage.slug}>
                <Link
                  href={`/urunler?kullanim=${usage.slug}`}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-cocoa-800/15 bg-cream-50 px-4 py-2 text-sm font-bold text-cocoa-800 hover:border-cocoa-800/40"
                >
                  {usage.name}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
