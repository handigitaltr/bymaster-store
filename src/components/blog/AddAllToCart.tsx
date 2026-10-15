"use client";

import Link from "next/link";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useState, useTransition } from "react";
import { addManyToCartAction } from "@/app/actions/cart";
import { useCart } from "@/components/cart/CartProvider";

/** "Tariften sepete": tarifte kullanılan satılabilir ürünlerin tamamını tek seferde sepete ekler */
export function AddAllToCart({ variantIds, count }: { variantIds: string[]; count: number }) {
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
