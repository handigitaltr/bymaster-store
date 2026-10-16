"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GitCompareArrows, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { STATIC_SITE } from "@/lib/site-mode";
import { COMPARE_KEY, COMPARE_MAX, useStoredList } from "@/lib/use-stored-list";

const SORT_LABELS: Record<string, string> = {
  onerilen: "Önerilen",
  "fiyat-artan": "Fiyat: düşükten yükseğe",
  "fiyat-azalan": "Fiyat: yüksekten düşüğe",
  "a-z": "Ada göre (A–Z)",
  "z-a": "Ada göre (Z–A)",
  yeni: "En yeniler",
};

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <form method="get" action={pathname} className="flex items-center gap-2">
      {Array.from(searchParams.entries())
        .filter(([key]) => key !== "sirala" && key !== "sayfa")
        .map(([key, val]) => (
          <input key={key} type="hidden" name={key} value={val} />
        ))}
      <label htmlFor="catalog-sort" className="whitespace-nowrap text-sm font-semibold text-cocoa-600">
        Sırala
      </label>
      <select
        id="catalog-sort"
        name="sirala"
        defaultValue={value}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("sayfa");
          if (event.target.value === "onerilen") params.delete("sirala");
          else params.set("sirala", event.target.value);
          const query = params.toString();
          router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
        }}
        className="field-input !min-h-10 !w-auto !py-1.5 text-sm"
      >
        {Object.entries(SORT_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="btn btn-sm btn-outline">
          Uygula
        </button>
      </noscript>
    </form>
  );
}

export function MobileFilterButton({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-sm btn-outline lg:hidden">
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        Filtrele
        {activeCount > 0 ? (
          <span className="grid min-w-5 place-content-center rounded-full bg-bordeaux-600 px-1 text-[0.65rem] leading-5 text-white">{activeCount}</span>
        ) : null}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Filtrele" variant="left">
        <div className="p-5">{children}</div>
        <div className="sticky bottom-0 border-t border-cocoa-800/10 bg-cream-50 p-4">
          <button type="button" onClick={() => setOpen(false)} className="btn btn-primary btn-block">
            Sonuçları göster
          </button>
        </div>
      </Dialog>
    </>
  );
}

/** Karşılaştırmaya eklenen ürünler için sabit alt çubuk */
function CompareBarInner() {
  const compare = useStoredList(COMPARE_KEY, COMPARE_MAX);
  if (compare.list.length === 0) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-xl items-center gap-3 rounded-full bg-cocoa-900 py-2 pl-5 pr-2 text-cream-50 shadow-2xl sm:bottom-6">
      <GitCompareArrows className="size-5 flex-none text-caramel-300" aria-hidden="true" />
      <p className="flex-1 text-sm font-semibold">
        {compare.list.length} ürün karşılaştırmada
        {compare.list.length < 2 ? <span className="hidden text-cream-300 sm:inline"> · en az 2 ürün seçin</span> : null}
      </p>
      <button type="button" onClick={compare.clear} className="grid size-9 place-content-center rounded-full text-cream-300 hover:bg-cream-50/10" aria-label="Karşılaştırmayı temizle">
        <X className="size-4" />
      </button>
      <Link href="/karsilastir" className="btn btn-sm btn-light" aria-disabled={compare.list.length < 2}>
        Karşılaştır
      </Link>
    </div>
  );
}

/** Statik vitrinde (GitHub Pages) sunucu gerektirdiği için gösterilmez */
export function CompareBar() {
  return STATIC_SITE ? null : <CompareBarInner />;
}
