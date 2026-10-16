import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, X } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import type { CatalogPage, Facet } from "@/lib/catalog";
import { catalogHref, hasActiveFilters, type CatalogParams } from "@/lib/catalog-params";
import { STATIC_SITE } from "@/lib/site-mode";
import { cx } from "@/lib/utils";
import { CompareBar, MobileFilterButton, SortSelect } from "./CatalogControls";
import { FilterPanel } from "./FilterPanel";

export function CatalogView({
  basePath,
  params,
  result,
  categoryFacet,
  emptyMessage = "Seçtiğiniz filtrelere uygun ürün bulunamadı.",
}: {
  basePath: string;
  params: CatalogParams;
  result: CatalogPage;
  categoryFacet?: Facet[];
  emptyMessage?: string;
}) {
  const activeCount = params.lezzet.length + params.kullanim.length + params.ambalaj.length + (params.stok ? 1 : 0);
  const chips: Array<{ label: string; href: string }> = [
    ...params.lezzet.map((value) => ({
      label: result.facets.flavors.find((facet) => facet.value === value)?.label ?? value,
      href: catalogHref(basePath, params, { lezzet: params.lezzet.filter((item) => item !== value) }),
    })),
    ...params.kullanim.map((value) => ({
      label: result.facets.usages.find((facet) => facet.value === value)?.label ?? value,
      href: catalogHref(basePath, params, { kullanim: params.kullanim.filter((item) => item !== value) }),
    })),
    ...params.ambalaj.map((value) => ({
      label: result.facets.packageTypes.find((facet) => facet.value.toLowerCase() === value)?.label ?? value,
      href: catalogHref(basePath, params, { ambalaj: params.ambalaj.filter((item) => item !== value) }),
    })),
    ...(params.stok ? [{ label: "Stoktakiler", href: catalogHref(basePath, params, { stok: false }) }] : []),
  ];

  // Statik vitrinde filtre ve sıralama adres parametresi gerektirdiği için yoktur; kategoriler bağlantı olarak gösterilir
  const panel = STATIC_SITE ? null : <FilterPanel basePath={basePath} params={params} facets={result.facets} categoryFacet={categoryFacet} />;

  return (
    <div className="container-page pb-24">
      <div className={cx("grid gap-10", !STATIC_SITE && "lg:grid-cols-[15rem_1fr] xl:grid-cols-[16.5rem_1fr]")}>
        {panel ? (
          <aside className="hidden lg:block" aria-label="Filtreler">
            <div className="sticky top-28">{panel}</div>
          </aside>
        ) : null}

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cocoa-800/10 pb-4">
            <p className="text-sm text-cocoa-600" aria-live="polite">
              <strong className="text-cocoa-900 tabular-nums">{result.total}</strong> ürün
            </p>
            {panel ? (
              <div className="flex items-center gap-2">
                <MobileFilterButton activeCount={activeCount}>{panel}</MobileFilterButton>
                <Suspense fallback={null}>
                  <SortSelect value={params.sirala} />
                </Suspense>
              </div>
            ) : null}
          </div>

          {STATIC_SITE && categoryFacet?.length ? (
            <nav aria-label="Kategoriler" className="mt-4 flex flex-wrap gap-2">
              {categoryFacet.map((category) => (
                <Link
                  key={category.value}
                  href={`/kategori/${category.value}`}
                  className="inline-flex items-center gap-2 rounded-full border border-cocoa-800/15 px-3.5 py-1.5 text-sm font-semibold text-cocoa-800 hover:border-cocoa-800"
                >
                  {category.label}
                  <span className="text-xs text-cocoa-500 tabular-nums">{category.count}</span>
                </Link>
              ))}
            </nav>
          ) : null}

          {chips.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <Link
                  key={chip.label + chip.href}
                  href={chip.href}
                  rel="nofollow"
                  scroll={false}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cocoa-800 py-1.5 pl-3.5 pr-2.5 text-xs font-bold text-cream-50 hover:bg-cocoa-950"
                >
                  {chip.label}
                  <X className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">filtresini kaldır</span>
                </Link>
              ))}
              {hasActiveFilters(params) ? (
                <Link
                  href={catalogHref(basePath, { ...params, lezzet: [], kullanim: [], ambalaj: [], stok: false })}
                  rel="nofollow"
                  scroll={false}
                  className="text-xs font-bold text-bordeaux-600 underline"
                >
                  Tümünü temizle
                </Link>
              ) : null}
            </div>
          ) : null}

          {result.items.length === 0 ? (
            <div className="mt-12 rounded-[1.6rem] bg-cream-200 px-6 py-16 text-center">
              <p className="font-display text-2xl text-cocoa-900">{emptyMessage}</p>
              <p className="mt-2 text-sm text-cocoa-600">Filtreleri azaltmayı veya farklı bir arama yapmayı deneyin.</p>
              <Link href="/urunler" className="btn btn-primary mt-6">
                Tüm ürünler
              </Link>
            </div>
          ) : (
            <ul className={cx("mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 2xl:grid-cols-4", STATIC_SITE && "lg:grid-cols-4")}>
              {result.items.map((product, index) => (
                <li key={product.id}>
                  <ProductCard product={product} priority={index < 3} showCompare sizes="(min-width: 1536px) 20vw, (min-width: 768px) 27vw, 46vw" />
                </li>
              ))}
            </ul>
          )}

          {result.hasMore ? (
            <div className="mt-14 flex flex-col items-center gap-3">
              <p className="text-xs font-semibold text-cocoa-500">
                {result.items.length} / {result.total} ürün gösteriliyor
              </p>
              <Link href={catalogHref(basePath, params, { sayfa: result.page + 1 })} scroll={false} className="btn btn-outline">
                Daha fazla ürün göster <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
      <CompareBar />
    </div>
  );
}
