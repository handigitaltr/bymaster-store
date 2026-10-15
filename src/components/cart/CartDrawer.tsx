"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Truck } from "lucide-react";
import type { AddToCartResult } from "@/app/actions/cart";
import { Dialog } from "@/components/ui/Dialog";
import { formatTRY } from "@/lib/money";
import { MiniProductRow } from "@/components/product/MiniProductRow";

type Payload = Extract<AddToCartResult, { ok: true }>;

export function CartDrawer({ payload, onClose }: { payload: Payload | null; onClose: () => void }) {
  const added = payload?.added;
  return (
    <Dialog open={Boolean(payload)} onClose={onClose} title="Sepete eklendi" variant="right">
      {payload ? (
        <div className="flex min-h-full flex-col">
          <div className="space-y-5 p-5">
            {added ? (
              <div className="flex gap-4">
                <div className="relative size-24 flex-none overflow-hidden rounded-xl bg-cream-200">
                  {added.imageUrl ? (
                    <Image src={added.imageUrl} alt={added.imageAlt} fill sizes="96px" className="object-contain mix-blend-multiply p-1.5" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-success">
                    <CheckCircle2 className="size-4" aria-hidden="true" /> Sepetinizde
                  </p>
                  <p className="mt-1 font-display text-lg leading-snug text-cocoa-900">{added.productName}</p>
                  <p className="text-sm text-cocoa-500">
                    {added.variantName} · {added.quantity} adet
                  </p>
                  <p className="mt-1 text-sm font-bold tabular-nums">{formatTRY(added.unitPriceKurus * added.quantity)}</p>
                </div>
              </div>
            ) : null}

            {payload.amountToFreeShippingKurus !== null && payload.amountToFreeShippingKurus > 0 ? (
              <p className="flex items-center gap-2 rounded-xl bg-cream-200 px-4 py-3 text-sm text-cocoa-700">
                <Truck className="size-4 flex-none text-caramel-700" aria-hidden="true" />
                <span>
                  Ücretsiz kargo için <strong className="tabular-nums">{formatTRY(payload.amountToFreeShippingKurus)}</strong> daha
                  ekleyin.
                </span>
              </p>
            ) : null}

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Link href="/sepet" onClick={onClose} className="btn btn-primary">
                Sepete git
              </Link>
              <button type="button" onClick={onClose} className="btn btn-outline">
                Alışverişe devam et
              </button>
            </div>
          </div>

          {payload.suggestions.length > 0 ? (
            <div className="mt-auto border-t border-cocoa-800/10 bg-cream-100 p-5">
              <p className="eyebrow">
                {payload.suggestionSource === "ORDERS" ? "Bu ürünle birlikte sipariş edilenler" : "Birlikte iyi gider"}
              </p>
              <ul className="mt-3 divide-y divide-cocoa-800/10">
                {payload.suggestions.map((product) => (
                  <li key={product.id} className="py-3">
                    <MiniProductRow product={product} onNavigate={onClose} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
