import { Truck } from "lucide-react";
import type { Totals } from "@/lib/pricing";
import { formatTRY } from "@/lib/money";

export function shippingLabel(totals: Totals): string {
  switch (totals.shippingStatus) {
    case "FREE_ITEMS":
    case "FREE_THRESHOLD":
    case "FREE_COUPON":
    case "FREE_ALWAYS":
      return "Ücretsiz";
    case "NOT_CONFIGURED":
      return "Belirlenmedi";
    case "EMPTY":
      return "—";
    default:
      return formatTRY(totals.shippingKurus);
  }
}

export function OrderSummary({ totals, couponCode }: { totals: Totals; couponCode?: string | null }) {
  return (
    <div className="space-y-4">
      <dl className="space-y-2.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-cocoa-600">Ara toplam</dt>
          <dd className="font-semibold tabular-nums">{formatTRY(totals.subtotalKurus)}</dd>
        </div>
        {totals.discountKurus > 0 ? (
          <div className="flex justify-between gap-4 text-success">
            <dt>İndirim{couponCode ? ` (${couponCode})` : ""}</dt>
            <dd className="font-semibold tabular-nums">−{formatTRY(totals.discountKurus)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-cocoa-600">Kargo</dt>
          <dd className="font-semibold tabular-nums">{shippingLabel(totals)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-cocoa-800/12 pt-3">
          <dt className="font-bold text-cocoa-900">Toplam</dt>
          <dd className="text-xl font-extrabold tabular-nums text-cocoa-950">{formatTRY(totals.totalKurus)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-xs text-cocoa-500">
          <dt>Toplama dahil KDV</dt>
          <dd className="tabular-nums">{formatTRY(totals.vatKurus)}</dd>
        </div>
      </dl>
      {totals.amountToFreeShippingKurus !== null && totals.amountToFreeShippingKurus > 0 ? (
        <p className="flex items-start gap-2 rounded-xl bg-cream-200 px-3.5 py-3 text-xs text-cocoa-700">
          <Truck className="mt-0.5 size-4 flex-none text-caramel-700" aria-hidden="true" />
          <span>
            Ücretsiz kargo için <strong className="tabular-nums">{formatTRY(totals.amountToFreeShippingKurus)}</strong> daha ekleyin.
          </span>
        </p>
      ) : null}
      {totals.shippingStatus === "FREE_ITEMS" ? (
        <p className="text-xs font-semibold text-success">Sepetinizdeki ürünlerde kargo ücretsiz.</p>
      ) : null}
    </div>
  );
}
