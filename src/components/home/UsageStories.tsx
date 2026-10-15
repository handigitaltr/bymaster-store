import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductCardData } from "@/lib/catalog";
import { cx } from "@/lib/utils";

export type UsageStory = {
  number: string;
  title: string;
  text: string;
  image: string;
  imageAlt: string;
  href: string;
  products: ProductCardData[];
};

export function UsageStories({ stories }: { stories: UsageStory[] }) {
  const offsets = ["lg:col-span-5", "lg:col-span-4 lg:mt-28", "lg:col-span-3 lg:mt-12"];
  const ratios = ["aspect-[4/5]", "aspect-[3/4]", "aspect-[3/5]"];
  return (
    <section className="relative overflow-hidden bg-cream-200 py-20 lg:py-32" aria-labelledby="sunum-baslik">
      <div className="container-page">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-4">Üründen sonuca</p>
            <h2 id="sunum-baslik" className="display-xl text-cocoa-900">
              Bir Sos.
              <br />
              <span className="italic text-bordeaux-600">Sayısız</span> Sunum.
            </h2>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-cocoa-600 lg:col-span-4 lg:col-start-9">
            Aynı sos, farklı bir tabakta bambaşka bir hikâye anlatır. İlham aldığınız sunumdan, onu mümkün kılan ürünlere tek
            adımda ulaşın.
          </p>
        </div>

        <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-8">
          {stories.map((story, index) => (
            <article key={story.number} className={cx("group", offsets[index])}>
              <Link href={story.href} className="block">
                <div className={cx("relative overflow-hidden rounded-[1.6rem] bg-cocoa-200", ratios[index])}>
                  <Image
                    src={story.image}
                    alt={story.imageAlt}
                    fill
                    sizes={index === 0 ? "(min-width:1024px) 40vw, 92vw" : "(min-width:1024px) 30vw, 92vw"}
                    className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
                  />
                  <span className="absolute bottom-3 right-4 text-[0.62rem] font-semibold text-white/85 [text-shadow:0_1px_6px_rgb(0_0_0/.5)]">
                    Temsili sunum fotoğrafı
                  </span>
                </div>
              </Link>
              <div className="mt-6 flex gap-4">
                <span className="font-display text-sm text-caramel-700 tabular-nums">{story.number}</span>
                <div className="min-w-0">
                  <h3 className="font-display text-2xl leading-tight text-cocoa-900">{story.title}</h3>
                  <p className="mt-2.5 text-[0.95rem] leading-relaxed text-cocoa-600">{story.text}</p>
                  {story.products.length > 0 ? (
                    <div className="mt-5">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-cocoa-500">Bu sunumda kullanılan ürünler</p>
                      <ul className="mt-2.5 flex flex-wrap gap-2">
                        {story.products.map((product) => (
                          <li key={product.id}>
                            <Link
                              href={`/urun/${product.slug}`}
                              className="flex items-center gap-2 rounded-full bg-cream-50 py-1 pl-1 pr-3 text-xs font-bold text-cocoa-800 ring-1 ring-cocoa-800/10 hover:ring-cocoa-800/40"
                            >
                              <span className="relative size-7 overflow-hidden rounded-full bg-cream-200">
                                {product.image ? (
                                  <Image src={product.image.url} alt="" fill sizes="28px" className="object-contain mix-blend-multiply" />
                                ) : null}
                              </span>
                              {product.name.replace(/^ByMaster\s+/, "").replace(/ Waffle Sosu$/, " Sos")}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <Link href={story.href} className="group/link mt-5 inline-flex items-center gap-2 text-sm font-bold text-cocoa-900">
                    <span className="link-underline">Tüm uygun ürünler</span>
                    <ArrowRight className="size-4 transition-transform group-hover/link:translate-x-1" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
