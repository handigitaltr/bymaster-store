"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCardData } from "@/lib/catalog";
import { STATIC_SITE } from "@/lib/site-mode";
import { cx } from "@/lib/utils";

type Family = { slug: string; name: string; color: string | null; description: string | null };

const TYPES = [
  { value: "all", label: "Tümü" },
  { value: "sauce", label: "Soslar" },
  { value: "topping", label: "Süslemeler" },
  { value: "other", label: "Karışım ve kitler" },
] as const;

function typeOf(product: ProductCardData) {
  if (["waffle-soslari", "cikolata-soslari", "meyveli-soslar"].includes(product.categorySlug)) return "sauce";
  if (["pirinc-patlaklari", "krep-kiriklari", "sekerlemeler-ve-toppingler"].includes(product.categorySlug)) return "topping";
  return "other";
}

// Sunucu (Node) ve tarayıcıdaki trigonometri sonuçları son basamakta farklılaşabilir; hydration uyumsuzluğunu önlemek için yuvarlanır
const round2 = (value: number) => Math.round(value * 100) / 100;

function arcPath(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number) {
  const point = (r: number, angle: number) => [round2(cx + r * Math.cos(angle)), round2(cy + r * Math.sin(angle))];
  const [x1, y1] = point(rOuter, start);
  const [x2, y2] = point(rOuter, end);
  const [x3, y3] = point(rInner, end);
  const [x4, y4] = point(rInner, start);
  const large = end - start > Math.PI ? 1 : 0;
  return `M${x1} ${y1} A${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
}

/**
 * Lezzet haritası: ürünleri lezzet ailesine, türüne ve kullanım alanına göre görsel olarak filtreler.
 * Aileler ürün adlarından türetilmiş etiketlerdir ve yönetim panelinden düzenlenebilir.
 */
export function FlavorMap({ families, usages, products }: { families: Family[]; usages: Array<{ slug: string; name: string }>; products: ProductCardData[] }) {
  const [family, setFamily] = useState<string | null>(null);
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("all");
  const [usage, setUsage] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) for (const flavor of product.flavors) map.set(flavor.slug, (map.get(flavor.slug) ?? 0) + 1);
    return map;
  }, [products]);

  const results = products.filter(
    (product) =>
      (!family || product.flavors.some((f) => f.slug === family)) &&
      (type === "all" || typeOf(product) === type) &&
      (!usage || product.usages.some((u) => u.slug === usage)),
  );

  const segment = (2 * Math.PI) / Math.max(1, families.length);
  const active = families.find((f) => f.slug === family) ?? null;

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div className="relative mx-auto max-w-[26rem]">
          <svg viewBox="0 0 320 320" className="h-auto w-full" aria-label="Lezzet ailesi çarkı">
            {families.map((item, index) => {
              const start = -Math.PI / 2 + index * segment + 0.012;
              const end = start + segment - 0.024;
              const selected = family === item.slug;
              const mid = (start + end) / 2;
              const lx = round2(160 + 118 * Math.cos(mid));
              const ly = round2(160 + 118 * Math.sin(mid));
              return (
                <g
                  key={item.slug}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-label={`${item.name} (${counts.get(item.slug) ?? 0} ürün)`}
                  onClick={() => setFamily(selected ? null : item.slug)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setFamily(selected ? null : item.slug);
                    }
                  }}
                  className="cursor-pointer outline-none [&:focus-visible>path]:stroke-cocoa-950 [&:focus-visible>path]:stroke-[3]"
                >
                  <path
                    d={arcPath(160, 160, selected ? 156 : 148, 78, start, end)}
                    fill={item.color ?? "#BC8855"}
                    opacity={family && !selected ? 0.35 : 1}
                    stroke="#FFFDF9"
                    strokeWidth={2}
                    className="transition-all duration-300"
                  />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none select-none"
                    style={{ fontFamily: "var(--font-manrope)", fontSize: 10.5, fontWeight: 800, fill: ["sade", "kuruyemis"].includes(item.slug) ? "#2b1611" : "#FFFDF9" }}
                  >
                    {item.name.length > 12 ? item.name.split(" ")[0] : item.name}
                  </text>
                </g>
              );
            })}
            <circle cx="160" cy="160" r="72" fill="#FFFDF9" />
            <text x="160" y="150" textAnchor="middle" style={{ fontFamily: "var(--font-fraunces)", fontSize: 19, fill: "#2b1611" }}>
              {active ? active.name.split(" ")[0] : "Lezzet"}
            </text>
            <text x="160" y="172" textAnchor="middle" style={{ fontFamily: "var(--font-fraunces)", fontSize: 19, fill: "#2b1611" }}>
              {active ? (active.name.split(" ").slice(1).join(" ") || "ailesi") : "haritası"}
            </text>
            <text x="160" y="194" textAnchor="middle" style={{ fontFamily: "var(--font-manrope)", fontSize: 10, fontWeight: 700, fill: "#8a5a2b" }}>
              {results.length} ürün
            </text>
          </svg>
        </div>
        {active?.description ? <p className="mt-4 text-center text-sm text-cocoa-600">{active.description}</p> : null}
        <p className="mt-2 text-center text-xs text-cocoa-400">Bir dilimi seçin; tekrar tıklayarak seçimi kaldırın.</p>
      </div>

      <div className="lg:col-span-7">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Ürün türü">
            {TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={type === option.value}
                onClick={() => setType(option.value)}
                className={cx(
                  "rounded-full px-4 py-2 text-sm font-bold transition",
                  type === option.value ? "bg-cocoa-800 text-cream-50" : "border border-cocoa-800/15 text-cocoa-700 hover:border-cocoa-800/40",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Kullanım alanı">
            {usages.map((option) => (
              <button
                key={option.slug}
                type="button"
                aria-pressed={usage === option.slug}
                onClick={() => setUsage(usage === option.slug ? null : option.slug)}
                className={cx(
                  "rounded-full px-3 py-1.5 text-xs font-bold transition",
                  usage === option.slug ? "bg-caramel-600 text-white" : "bg-cream-200 text-cocoa-700 hover:bg-cream-300",
                )}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-6 text-sm text-cocoa-600" aria-live="polite">
          <strong className="text-cocoa-900">{results.length}</strong> ürün listeleniyor
        </p>
        <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
          {(STATIC_SITE ? results : results.slice(0, 9)).map((product) => (
            <li key={product.id}>
              <ProductCard product={product} sizes="(min-width: 1024px) 18vw, 46vw" />
            </li>
          ))}
        </ul>
        {/* Statik vitrinde filtreli katalog adresi çalışmadığından tüm sonuçlar burada listelenir */}
        {!STATIC_SITE && results.length > 9 ? (
          <Link
            href={`/urunler?${new URLSearchParams({ ...(family ? { lezzet: family } : {}), ...(usage ? { kullanim: usage } : {}) }).toString()}`}
            className="btn btn-outline mt-8"
          >
            Tüm {results.length} ürünü listede gör
          </Link>
        ) : null}
      </div>
    </div>
  );
}
