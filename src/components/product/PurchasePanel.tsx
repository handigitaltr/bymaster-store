"use client";

import { useEffect, useRef, useState } from "react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { PackageBadge } from "@/components/ui/PackageBadge";
import { Price } from "@/components/ui/Price";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import type { Availability } from "@/lib/availability";
import { formatTRY, formatWeight } from "@/lib/money";
import { cx } from "@/lib/utils";
import { CompareToggle, FavoriteButton } from "./ListToggles";
import { StockNotifyForm } from "./StockNotifyForm";

export type PanelVariant = {
  id: string;
  sku: string;
  name: string;
  packageType: string;
  netWeightGrams: number | null;
  unitsPerCase: number | null;
  priceKurus: number;
  compareAtPriceKurus: number | null;
  unitPricePerKgKurus: number | null;
  vatRate: number;
  availability: Availability;
  stockLeft: number | null;
  minQty: number;
  maxQty: number;
};

export function PurchasePanel({
  productId,
  productName,
  variants,
}: {
  productId: string;
  productName: string;
  variants: PanelVariant[];
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const variant = variants.find((v) => v.id === selectedId) ?? variants[0];
  const [quantity, setQuantity] = useState(variant?.minQty ?? 1);
  const [showSticky, setShowSticky] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Ambalaj değişince adet, yeni ambalajın en az / en çok sınırlarına çekilir
  const selectVariant = (id: string) => {
    const next = variants.find((v) => v.id === id);
    setSelectedId(id);
    if (next) setQuantity((q) => Math.min(Math.max(q, next.minQty), Math.max(next.minQty, next.maxQty)));
  };

  useEffect(() => {
    const node = buttonRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
      threshold: 0,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!variant) return null;
  const purchasable = (variant.availability === "IN_STOCK" || variant.availability === "LOW_STOCK") && variant.priceKurus > 0;
  const comingSoon = variant.availability === "COMING_SOON";

  return (
    <div className="space-y-6" role="group" aria-label="Satın alma seçenekleri">
      {variants.length > 1 ? (
        <fieldset>
          <legend className="field-label">Ambalaj seçin</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {variants.map((option) => (
              <label
                key={option.id}
                className={cx(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 transition",
                  option.id === variant.id ? "border-cocoa-800 bg-cream-100 ring-1 ring-cocoa-800" : "border-cocoa-800/15 hover:border-cocoa-800/40",
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="variant"
                    value={option.id}
                    checked={option.id === variant.id}
                    onChange={() => selectVariant(option.id)}
                    className="radio"
                  />
                  <span>
                    <span className="block text-sm font-bold text-cocoa-900">{option.name}</span>
                    <span className="block text-xs text-cocoa-500">{formatWeight(option.netWeightGrams) ?? option.packageType}</span>
                  </span>
                </span>
                <span className="text-sm font-bold tabular-nums">{option.priceKurus > 0 ? formatTRY(option.priceKurus) : "—"}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <PackageBadge packageType={variant.packageType} netWeightGrams={variant.netWeightGrams} />
        {variant.unitsPerCase ? (
          <span className="pill bg-cream-200 text-cocoa-700">Koli içi {variant.unitsPerCase} adet</span>
        ) : null}
        <AvailabilityBadge availability={variant.availability} stockLeft={variant.stockLeft} />
      </div>

      {!comingSoon && variant.priceKurus > 0 ? (
        <div>
          <Price kurus={variant.priceKurus} compareAtKurus={variant.compareAtPriceKurus} size="xl" />
          <p className="mt-1.5 text-sm text-cocoa-500">
            KDV dahil (%{variant.vatRate})
            {variant.unitPricePerKgKurus && variant.netWeightGrams !== 1000
              ? ` · Birim fiyat: ${formatTRY(variant.unitPricePerKgKurus)}/kg`
              : ""}
          </p>
        </div>
      ) : (
        <p className="font-display text-2xl text-bordeaux-600">Yakında satışta</p>
      )}

      {purchasable ? (
        <div ref={buttonRef} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <QuantityStepper value={quantity} onChange={setQuantity} min={variant.minQty} max={Math.max(variant.minQty, variant.maxQty)} />
          <div className="flex-1">
            <AddToCartButton variantId={variant.id} quantity={quantity} productName={productName} priceKurus={variant.priceKurus} />
          </div>
        </div>
      ) : (
        <div ref={buttonRef}>
          <StockNotifyForm variantId={variant.id} comingSoon={comingSoon} />
        </div>
      )}

      {variant.minQty > 1 ? <p className="text-xs text-cocoa-500">Bu ürün en az {variant.minQty} adet sipariş edilebilir.</p> : null}

      <div className="flex items-center gap-5 text-sm">
        <span className="inline-flex items-center gap-2">
          <FavoriteButton productId={productId} productName={productName} className="!size-9 !bg-cream-200" />
          <span className="font-semibold text-cocoa-600">Favori</span>
        </span>
        <CompareToggle productId={productId} productName={productName} />
        <span className="ml-auto text-xs text-cocoa-400">Stok kodu: {variant.sku}</span>
      </div>

      {purchasable ? (
        <div
          className={cx(
            "fixed inset-x-0 bottom-0 z-30 border-t border-cocoa-800/10 bg-cream-50/95 p-3 backdrop-blur-md transition-transform duration-300 md:hidden",
            showSticky ? "translate-y-0" : "translate-y-full",
          )}
          inert={!showSticky}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-cocoa-900">{productName}</p>
              <p className="text-sm font-extrabold tabular-nums">{formatTRY(variant.priceKurus * quantity)}</p>
            </div>
            <div className="w-40">
              <AddToCartButton variantId={variant.id} quantity={quantity} productName={productName} priceKurus={variant.priceKurus} appearance="compact" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
