"use client";

import Link from "next/link";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useState, useTransition } from "react";
import { addManyToCartAction } from "@/app/actions/cart";
import { useCart } from "@/components/cart/CartProvider";
import { STATIC_SITE } from "@/lib/site-mode";

/** "Tariften sepete": tarifte kullanılan satılabilir ürünlerin tamamını tek seferde sepete ekler */
function AddAllToCartInner({ variantIds, count }: { variantIds: string[]; count: number }) {
  const { setCartCount } = useCart();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ added: number; messages: string[] } | null>(null);
  if (variantIds.length < 2) return null;
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const response = await addManyToCartAction(variantIds);
            setCartCount(response.count);
            setResult({ added: response.added, messages: response.messages });
          })
        }
        className="btn btn-accent btn-block"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ShoppingBag className="size-4" aria-hidden="true" />}
        Tarifteki {count} ürünü sepete ekle
      </button>
      {result ? (
        <div role="status" className="mt-3 text-sm">
          {result.added > 0 ? (
            <p className="font-semibold text-success">
              {result.added} ürün sepetinize eklendi.{" "}
              <Link href="/sepet" className="underline">
                Sepete git
              </Link>
            </p>
          ) : null}
          {result.messages.map((message) => (
            <p key={message} className="text-danger">
              {message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Statik vitrinde (GitHub Pages) sunucu gerektirdiği için gösterilmez */
export function AddAllToCart(props: React.ComponentProps<typeof AddAllToCartInner>) {
  return STATIC_SITE ? null : <AddAllToCartInner {...props} />;
}
