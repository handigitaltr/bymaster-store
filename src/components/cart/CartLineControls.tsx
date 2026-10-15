"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { setQuantityAction } from "@/app/actions/cart";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { useCart } from "./CartProvider";

export function CartLineControls({
  variantId,
  quantity,
  min,
  max,
  productName,
}: {
  variantId: string;
  quantity: number;
  min: number;
  max: number;
  productName: string;
}) {
  const { refresh } = useCart();
  const [value, setValue] = useState(quantity);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sunucudan gelen adet değişirse (ör. stok düzeltmesi) yerel değeri eşitle
  const [syncedQuantity, setSyncedQuantity] = useState(quantity);
  if (syncedQuantity !== quantity) {
    setSyncedQuantity(quantity);
    setValue(quantity);
  }

  const commit = (next: number) => {
    setValue(next);
    setError(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      startTransition(async () => {
        const result = await setQuantityAction(variantId, next);
        if (!result.ok) {
          setError(result.message ?? "Adet güncellenemedi.");
          setValue(quantity);
        }
        await refresh();
      });
    }, 350);
  };

  const remove = () => {
    if (timer.current) clearTimeout(timer.current);
    startTransition(async () => {
      await setQuantityAction(variantId, 0);
      await refresh();
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <QuantityStepper value={value} onChange={commit} min={Math.min(min, value)} max={Math.max(max, 1)} size="sm" label={`${productName} adedi`} />
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-cocoa-500 hover:text-bordeaux-600"
          aria-label={`${productName} ürününü sepetten çıkar`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Kaldır</span>
        </button>
        {pending ? <LoaderCircle className="size-4 animate-spin text-cocoa-400" aria-label="Güncelleniyor" /> : null}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
