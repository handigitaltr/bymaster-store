import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Markdown } from "@/components/content/Markdown";
import { getCatalogFacts, getPackagingSummary } from "@/lib/catalog";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const page = await db.page.findFirst({ where: { slug: "hakkimizda", status: "PUBLISHED" }, select: { seoTitle: true, seoDescription: true } });
  return pageMetadata({
    title: page?.seoTitle ?? "Hakkımızda",
    description: page?.seoDescription ?? "ByMaster Professional Pastry Products: profesyonel ve ev mutfakları için pastacılık ürünleri.",
    path: "/hakkimizda",
    image: "/images/editorial/doku-cikolata-akis.jpg",
  });
}

export default async function AboutPage() {
  const [page, facts, packaging] = await Promise.all([
    db.page.findFirst({ where: { slug: "hakkimizda", status: "PUBLISHED" }, select: { content: true } }),
    getCatalogFacts(),
    getPackagingSummary(),
  ]);

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-cocoa-950 text-cream-50">
        <Image src="/images/editorial/doku-cikolata-akis.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-50" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-cocoa-950 via-cocoa-950/50 to-transparent" />
        <div className="container-page flex min-h-[28rem] flex-col justify-end py-16 lg:min-h-[34rem]">
          <p className="eyebrow eyebrow-light">Hakkımızda</p>
          <h1 className="display-xl mt-4 max-w-4xl">
            Professional <span className="italic text-caramel-300">Pastry</span> Products.
          </h1>
        </div>
      </section>

      <section className="bg-cream-50 py-20">
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {page ? <Markdown content={page.content} /> : <p className="text-cocoa-600">İçerik yakında eklenecek.</p>}
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="space-y-8 lg:sticky lg:top-28">
              <blockquote className="border-l-2 border-caramel-500 pl-6 font-display text-3xl italic leading-snug text-cocoa-800">
                Sunum, bir tatlının ilk izlenimidir.
              </blockquote>
              <dl className="grid grid-cols-2 gap-6 border-t border-cocoa-800/12 pt-6">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Ürün</dt>
                  <dd className="mt-1 font-display text-4xl text-cocoa-900">{facts.productCount}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Kategori</dt>
                  <dd className="mt-1 font-display text-4xl text-cocoa-900">{facts.categoryCount}</dd>
                </div>
              </dl>
              <ul className="space-y-2 text-sm text-cocoa-700">
                {packaging.map((row) => (
                  <li key={row.categorySlug} className="flex justify-between gap-4 border-b border-cocoa-800/8 pb-2">
                    <span>{row.label}</span>
                    <span className="text-cocoa-500">{row.format}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-cream-200 py-16" aria-label="Görseller">
        <div className="container-page grid grid-cols-3 gap-3 sm:gap-5">
          {[
            { src: "/images/editorial/pastane-krema.jpg", alt: "Krema sıkarak süsleme yapılan tatlılar" },
            { src: "/images/editorial/waffle-kase.jpg", alt: "Çilek ve çikolata soslu waffle kasesi" },
            { src: "/images/editorial/pastane-hamur.jpg", alt: "Hamur işleri ve pastacılık araçları" },
          ].map((image, index) => (
            <div key={image.src} className={`relative overflow-hidden rounded-[1.2rem] ${index === 1 ? "aspect-[3/4] translate-y-8" : "aspect-[3/4]"}`}>
              <Image src={image.src} alt={image.alt} fill sizes="33vw" className="object-cover" />
            </div>
          ))}
        </div>
        <p className="container-page mt-12 text-xs text-cocoa-500">Fotoğraflar temsilidir.</p>
      </section>

      <section className="bg-cream-50 py-20">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <Link href="/urunler" className="group rounded-[1.4rem] bg-cocoa-800 p-8 text-cream-50">
            <p className="eyebrow eyebrow-light">Katalog</p>
            <p className="mt-3 font-display text-3xl">Ürünleri keşfedin</p>
            <ArrowRight className="mt-6 size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link href="/profesyonel" className="group rounded-[1.4rem] border border-cocoa-800/15 p-8 text-cocoa-900">
            <p className="eyebrow">İşletmeler</p>
            <p className="mt-3 font-display text-3xl">Profesyonellere özel çözümler</p>
            <ArrowRight className="mt-6 size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
