import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cx } from "@/lib/utils";

export type MosaicCategory = {
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  accentColor: string | null;
  count: number;
};

// Kategori başına yerleşim ve renk tonu (koyu karolarda görsel krem bir "tabak" üzerinde durur)
const LAYOUT: Record<string, { area: string; dark?: boolean; tone: string }> = {
  "waffle-soslari": { area: "col-span-2 lg:col-span-6 lg:row-span-2", dark: true, tone: "bg-cocoa-800" },
  "cikolata-soslari": { area: "lg:col-span-3", dark: true, tone: "bg-bordeaux-600" },
  "pirinc-patlaklari": { area: "lg:col-span-3", tone: "bg-cream-300" },
  "krep-kiriklari": { area: "lg:col-span-3", tone: "bg-caramel-200" },
  "sekerlemeler-ve-toppingler": { area: "lg:col-span-3", tone: "bg-[#efe3ea]" },
  "waffle-mix-ve-karisimlar": { area: "lg:col-span-5", tone: "bg-[#ece4d8]" },
  "evde-tatli-kitleri": { area: "col-span-2 lg:col-span-7", tone: "bg-[#e9d9c2]" },
};

export function CategoryMosaic({ categories }: { categories: MosaicCategory[] }) {
  const tiles = categories.filter((category) => LAYOUT[category.slug] && category.count > 0);
  return (
    <section className="bg-cream-50 py-20 lg:py-28" aria-labelledby="kategori-baslik">
      <div className="container-page">
        <SectionHeader
          eyebrow="Kategoriler"
          title={<span id="kategori-baslik">Tatlı Dünyanı Oluştur</span>}
          description="Sostan süslemeye, karışımdan evde tatlı kitlerine: sunumunuzu katman katman kurun."
          action={{ href: "/urunler", label: "Tüm ürünleri gör" }}
        />
        <div className="mt-12 grid auto-rows-[13.5rem] grid-cols-2 gap-3 sm:gap-4 lg:auto-rows-[15.5rem] lg:grid-cols-12">
          {tiles.map((category, index) => {
            const layout = LAYOUT[category.slug];
            const big = index === 0;
            return (
              <Link
                key={category.slug}
                href={`/kategori/${category.slug}`}
                className={cx(
                  "group relative isolate flex overflow-hidden rounded-[1.4rem] p-5 transition-shadow hover:shadow-[var(--shadow-lift)] sm:p-6",
                  layout.area,
                  layout.tone,
                  layout.dark ? "text-cream-50" : "text-cocoa-900",
                )}
              >
                {category.imageUrl ? (
                  <span
                    className={cx(
                      "absolute overflow-hidden rounded-full transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]",
                      big ? "-bottom-10 -right-10 size-[18rem] sm:size-[26rem]" : "-bottom-6 -right-6 size-32 sm:size-36 lg:size-40",
                      layout.dark ? "bg-cream-100" : "bg-cream-50/70",
                    )}
                  >
                    <Image
                      src={category.imageUrl}
                      alt={category.imageAlt ?? ""}
                      fill
                      sizes={big ? "(min-width:1024px) 26rem, 60vw" : "13rem"}
                      className={cx("object-contain mix-blend-multiply", big ? "p-12" : "p-5")}
                    />
                  </span>
                ) : null}
                <span className={cx("relative z-10 flex h-full flex-col", big ? "max-w-[70%]" : "max-w-[85%]")}>
                  <span className={cx("text-xs font-bold tabular-nums", layout.dark ? "text-caramel-300" : "text-caramel-800")}>
                    {String(index + 1).padStart(2, "0")} — {category.count} ürün
                  </span>
                  <span className={cx("mt-2 font-display leading-[1.05]", big ? "text-4xl sm:text-5xl" : "text-2xl")}>{category.name}</span>
                  {big && category.description ? (
                    <span className="mt-4 hidden max-w-xs text-sm leading-relaxed text-cream-200 sm:block">{category.description}</span>
                  ) : null}
                  <span
                    className={cx(
                      "mt-auto grid size-10 place-content-center rounded-full transition-transform group-hover:rotate-45",
                      layout.dark ? "bg-cream-50 text-cocoa-900" : "bg-cocoa-800 text-cream-50",
                    )}
                    aria-hidden="true"
                  >
                    <ArrowUpRight className="size-4" />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
