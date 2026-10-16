"use client";

import { GitCompareArrows, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { STATIC_SITE } from "@/lib/site-mode";
import { COMPARE_KEY, COMPARE_MAX, FAVORITES_KEY, useStoredList } from "@/lib/use-stored-list";
import { cx } from "@/lib/utils";

function FavoriteButtonInner({ productId, productName, className }: { productId: string; productName: string; className?: string }) {
  const favorites = useStoredList(FAVORITES_KEY);
  const active = favorites.has(productId);
  return (
    <button
      type="button"
      onClick={() => favorites.toggle(productId)}
      aria-pressed={active}
      aria-label={active ? `${productName} favorilerden çıkar` : `${productName} favorilere ekle`}
      className={cx(
        "grid size-10 place-content-center rounded-full bg-cream-50/85 text-cocoa-700 backdrop-blur-sm transition hover:bg-cream-50 hover:text-bordeaux-600",
        className,
      )}
    >
      <Heart className={cx("size-[1.1rem]", active && "fill-bordeaux-600 text-bordeaux-600")} aria-hidden="true" />
    </button>
  );
}

function CompareToggleInner({ productId, productName, className }: { productId: string; productName: string; className?: string }) {
  const compare = useStoredList(COMPARE_KEY, COMPARE_MAX);
  const [notice, setNotice] = useState<string | null>(null);
  const active = compare.has(productId);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <span className={cx("relative inline-flex", className)}>
      <button
        type="button"
        onClick={() => {
          if (!active && compare.list.length >= COMPARE_MAX) {
            setNotice(`En fazla ${COMPARE_MAX} ürün karşılaştırabilirsiniz.`);
            return;
          }
          compare.toggle(productId);
        }}
        aria-pressed={active}
        className={cx(
          "inline-flex items-center gap-1.5 text-xs font-bold transition",
          active ? "text-bordeaux-600" : "text-cocoa-500 hover:text-cocoa-800",
        )}
      >
        <GitCompareArrows className="size-4" aria-hidden="true" />
        {active ? "Karşılaştırmada" : "Karşılaştır"}
        <span className="sr-only"> — {productName}</span>
      </button>
      {notice ? (
        <span role="status" className="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg bg-cocoa-900 px-3 py-2 text-xs text-cream-50 shadow-lg">
          {notice}
        </span>
      ) : null}
    </span>
  );
}

/** Statik vitrinde (GitHub Pages) sunucu gerektirdiği için gösterilmez */
export function FavoriteButton(props: React.ComponentProps<typeof FavoriteButtonInner>) {
  return STATIC_SITE ? null : <FavoriteButtonInner {...props} />;
}

/** Statik vitrinde (GitHub Pages) sunucu gerektirdiği için gösterilmez */
export function CompareToggle(props: React.ComponentProps<typeof CompareToggleInner>) {
  return STATIC_SITE ? null : <CompareToggleInner {...props} />;
}
