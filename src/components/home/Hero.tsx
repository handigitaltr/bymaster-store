import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatTRY } from "@/lib/money";

type Facts = { sauceCount: number; beadColors: number; largestKovaGrams: number | null };
type Spotlight = { slug: string; name: string; subtitle: string | null; imageUrl: string; priceKurus: number } | null;

export function Hero({ facts, spotlight }: { facts: Facts; spotlight: Spotlight }) {
  const kovaKg = facts.largestKovaGrams ? facts.largestKovaGrams / 1000 : null;
  return (
    <section className="relative overflow-hidden bg-cream-200">
      <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[38%] bg-cocoa-800 lg:block">
        <div className="waffle-grid absolute inset-0 opacity-70" />
      </div>
      <div className="container-page relative grid gap-12 pb-20 pt-10 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-20">
        <div className="self-center lg:col-span-7 lg:pr-8">
          <p className="eyebrow animate-fade-up">ByMaster · Professional Pastry Products</p>
          <h1 className="display-xl mt-6 animate-fade-up text-cocoa-900 [animation-delay:80ms]">
            Tatlı Fikirlerin{" "}
            <span className="relative inline-block italic text-bordeaux-600" style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}>
              Profesyonel
              <svg aria-hidden="true" viewBox="0 0 300 18" className="absolute -bottom-2 left-0 h-3 w-full text-caramel-400" preserveAspectRatio="none">
                <path d="M2 12 C 60 2, 120 18, 180 8 S 270 4, 298 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>{" "}
            Dokunuşu.
          </h1>
          <p className="mt-8 max-w-xl animate-fade-up text-lg leading-relaxed text-cocoa-600 [animation-delay:160ms] md:text-xl">
            Her sunuma karakter, her tarife lezzet katan profesyonel pastacılık ürünlerini keşfedin.
          </p>
          <div className="mt-10 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:240ms]">
            <Link href="/urunler" className="btn btn-lg btn-primary group">
              Ürünleri Keşfet
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link href="/tarifler" className="btn btn-lg btn-outline">
              Tariflerden İlham Al
            </Link>
          </div>
          <dl className="mt-14 grid max-w-xl grid-cols-3 gap-4 border-t border-cocoa-800/15 pt-6 sm:gap-8">
            <div>
              <dt className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-cocoa-500">Waffle ve çikolata sosu</dt>
              <dd className="mt-1 font-display text-4xl text-cocoa-900">{facts.sauceCount}</dd>
            </div>
            <div>
              <dt className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-cocoa-500">Pirinç patlağı seçeneği</dt>
              <dd className="mt-1 font-display text-4xl text-cocoa-900">{facts.beadColors}</dd>
            </div>
            {kovaKg ? (
              <div>
                <dt className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-cocoa-500">Profesyonel kova</dt>
                <dd className="mt-1 font-display text-4xl text-cocoa-900">
                  {kovaKg}
                  <span className="ml-1 text-xl">kg</span>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[26rem] overflow-hidden rounded-b-[2rem] rounded-t-[999px] bg-cocoa-700 shadow-[var(--shadow-lift)] lg:max-w-none">
            <Image
              src="/images/editorial/hero-waffle.jpg"
              alt="Çilek ve çikolatayla sunulmuş katlı waffle"
              fill
              priority
              sizes="(min-width: 1024px) 38vw, 90vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-cocoa-950/35 via-transparent to-transparent" />
            <p className="absolute bottom-4 right-5 text-[0.65rem] font-semibold text-cream-100/85">Temsili sunum fotoğrafı</p>
          </div>
          {spotlight ? (
            <Link
              href={`/urun/${spotlight.slug}`}
              className="group absolute -bottom-8 left-1/2 flex w-[min(22rem,92%)] -translate-x-1/2 items-center gap-4 rounded-full bg-cream-50 p-2 pr-6 shadow-[var(--shadow-lift)] transition-transform hover:-translate-y-0.5 lg:-left-14 lg:translate-x-0"
            >
              <span className="relative size-20 flex-none overflow-hidden rounded-full bg-cream-200">
                <Image src={spotlight.imageUrl} alt="" fill sizes="80px" className="object-contain p-1.5 mix-blend-multiply" />
              </span>
              <span className="min-w-0">
                <span className="eyebrow block !text-[0.6rem]">Öne çıkan sos</span>
                <span className="mt-0.5 block truncate font-display text-lg leading-tight text-cocoa-900 group-hover:text-bordeaux-600">
                  {spotlight.name.replace(/^ByMaster\s+/, "")}
                </span>
                <span className="block text-xs font-semibold text-cocoa-500">
                  {spotlight.subtitle} · {formatTRY(spotlight.priceKurus)}
                </span>
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
