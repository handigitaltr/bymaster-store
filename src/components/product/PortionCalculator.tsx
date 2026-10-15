"use client";

import { Calculator } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatNumber, formatTRY, formatWeight } from "@/lib/money";
import { portionPlan } from "@/lib/pricing";

export type CalculatorOption = {
  variantId: string;
  label: string;
  netWeightGrams: number;
  priceKurus: number;
  servingGrams: number | null; // yönetici tarafından doğrulanmış değer
  purchasable: boolean;
  packageLabel: string;
};

/**
 * Profesyonel porsiyon hesaplayıcı. Tüketim oranı uydurulmaz: yalnızca yönetici tarafından doğrulanmış
 * bir değer varsa önerilir; yoksa kullanıcı kendi porsiyon ölçüsünü girer.
 */
export function PortionCalculator({ options, title = "Porsiyon hesaplayıcı" }: { options: CalculatorOption[]; title?: string }) {
  const id = useId();
  const [variantId, setVariantId] = useState(options[0]?.variantId ?? "");
  const option = options.find((o) => o.variantId === variantId) ?? options[0];
  const [portions, setPortions] = useState("100");
  const [grams, setGrams] = useState(option?.servingGrams ? String(option.servingGrams) : "");

  const plan = useMemo(() => {
    const p = Number.parseInt(portions, 10);
    const g = Number.parseFloat(grams.replace(",", "."));
    if (!option || !Number.isFinite(p) || !Number.isFinite(g) || p <= 0 || g <= 0) return null;
    return portionPlan({ portions: Math.min(p, 1_000_000), gramsPerPortion: Math.min(g, 5000), packageNetGrams: option.netWeightGrams, packagePriceKurus: option.priceKurus });
  }, [portions, grams, option]);

  if (!option) return null;

  return (
    <section className="rounded-[1.6rem] border border-cocoa-800/10 bg-cream-100 p-6 sm:p-8" aria-labelledby={`${id}-title`}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-content-center rounded-full bg-cocoa-800 text-cream-50">
          <Calculator className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id={`${id}-title`} className="font-display text-2xl text-cocoa-900">
            {title}
          </h2>
          <p className="text-sm text-cocoa-500">Porsiyon sayınıza göre ihtiyaç duyacağınız ambalaj adedini ve malzeme maliyetini hesaplayın.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {options.length > 1 ? (
          <div className="sm:col-span-3">
            <label htmlFor={`${id}-product`} className="field-label">
              Ürün
            </label>
            <select
              id={`${id}-product`}
              className="field-input"
              value={variantId}
              onChange={(event) => {
                setVariantId(event.target.value);
                const next = options.find((o) => o.variantId === event.target.value);
                setGrams(next?.servingGrams ? String(next.servingGrams) : "");
              }}
            >
              {options.map((o) => (
                <option key={o.variantId} value={o.variantId}>
                  {o.label} — {o.packageLabel}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label htmlFor={`${id}-portions`} className="field-label">
            Porsiyon sayısı
          </label>
          <input
            id={`${id}-portions`}
            type="number"
            inputMode="numeric"
            min={1}
            className="field-input"
            value={portions}
            onChange={(event) => setPortions(event.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-grams`} className="field-label">
            Porsiyon başına kullanım (gram)
          </label>
          <input
            id={`${id}-grams`}
            type="number"
            inputMode="decimal"
            min={1}
            step="any"
            className="field-input"
            placeholder="ör. kendi tartımınız"
            value={grams}
            onChange={(event) => setGrams(event.target.value)}
            aria-describedby={`${id}-grams-hint`}
          />
          <p id={`${id}-grams-hint`} className="field-hint">
            {option.servingGrams
              ? `ByMaster tarafından doğrulanmış öneri: porsiyon başına ${option.servingGrams} g.`
              : "Bu ürün için doğrulanmış bir porsiyon ölçüsü tanımlı değil; kendi sunumunuzu tartarak bulduğunuz değeri girin."}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-cream-50 p-5" aria-live="polite">
        {plan ? (
          <>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Toplam ihtiyaç</dt>
                <dd className="mt-1 font-display text-2xl text-cocoa-900">{formatWeight(Math.ceil(plan.totalGrams)) ?? "0 g"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Gerekli ambalaj</dt>
                <dd className="mt-1 font-display text-2xl text-cocoa-900">
                  {plan.packages} <span className="text-base">× {option.packageLabel}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Porsiyon maliyeti</dt>
                <dd className="mt-1 font-display text-2xl text-cocoa-900">{formatTRY(Math.round(plan.costPerPortionKurus))}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Ambalaj tutarı</dt>
                <dd className="mt-1 font-display text-2xl text-cocoa-900">{formatTRY(plan.totalCostKurus)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-cocoa-500">
              Bir ambalaj yaklaşık {formatNumber(plan.portionsPerPackage)} porsiyon karşılar
              {plan.leftoverGrams > 0 ? `; hesaplanan ihtiyaç sonrası yaklaşık ${formatWeight(Math.floor(plan.leftoverGrams))} ürün artar` : ""}. Sonuçlar
              güncel KDV dahil liste fiyatıyla hesaplanan yaklaşık değerlerdir; fire ve servis farkları dahil değildir.
            </p>
            {option.purchasable && plan.packages > 0 ? (
              <div className="mt-4 max-w-xs">
                <AddToCartButton
                  variantId={option.variantId}
                  quantity={plan.packages}
                  productName={option.label}
                  priceKurus={option.priceKurus}
                  appearance="compact"
                  label={`${plan.packages} adet sepete ekle`}
                />
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-cocoa-500">Sonuçları görmek için porsiyon sayısını ve porsiyon başına kullanım miktarını girin.</p>
        )}
      </div>
    </section>
  );
}
