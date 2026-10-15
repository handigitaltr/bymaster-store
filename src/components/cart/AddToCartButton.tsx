"use client";

import { Check, LoaderCircle, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { addToCartAction } from "@/app/actions/cart";
import { track } from "@/lib/analytics";
import { cx } from "@/lib/utils";
import { useCart } from "./CartProvider";

export function AddToCartButton({
  variantId,
  quantity = 1,
  productName,
  priceKurus,
  disabled,
  appearance = "full",
  className,
  label = "Sepete ekle",
  onAdded,
}: {
  variantId: string;
  quantity?: number;
  productName: string;
  priceKurus?: number;
  disabled?: boolean;
  appearance?: "full" | "compact" | "icon";
  className?: string;
  label?: string;
  onAdded?: () => void;
}) {
  const { showAdded, setCartCount } = useCart();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 1800);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await addToCartAction({ variantId, quantity });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setCartCount(result.count);
      setJustAdded(true);
      showAdded(result);
      onAdded?.();
      if (priceKurus !== undefined) {
        track("add_to_cart", {
          value: (priceKurus * quantity) / 100,
          items: [{ item_id: variantId, item_name: productName, price: priceKurus / 100, quantity }],
        });
      }
    });
  };

  const icon = pending ? (
    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
  ) : justAdded ? (
    <Check className="size-4" aria-hidden="true" />
  ) : appearance === "full" ? (
    <ShoppingBag className="size-4" aria-hidden="true" />
  ) : (
    <Plus className="size-4" aria-hidden="true" />
  );

  return (
    <div className={cx("relative", appearance !== "icon" && "w-full", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || pending}
        aria-busy={pending}
        aria-label={appearance === "icon" ? `${productName} — ${label}` : undefined}
        className={cx(
          appearance === "icon"
            ? "grid size-11 place-content-center rounded-full bg-cocoa-800 text-cream-50 shadow-md transition hover:bg-cocoa-950 disabled:opacity-50"
            : appearance === "compact"
              ? "btn btn-sm btn-outline w-full"
              : "btn btn-lg btn-primary w-full",
        )}
      >
        {icon}
        {appearance !== "icon" ? <span>{justAdded ? "Sepete eklendi" : label}</span> : null}
      </button>
      {error ? (
        <p role="alert" className="absolute inset-x-0 top-full z-10 mt-1.5 rounded-lg bg-bordeaux-700 px-3 py-2 text-xs font-semibold text-white shadow-lg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
