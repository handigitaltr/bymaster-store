import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { ProductCardData } from "@/lib/catalog";
import { formatTRY } from "@/lib/money";
import { productTint } from "./ProductCard";

export function MiniProductRow({
  product,
  note,
  onNavigate,
}: {
  product: ProductCardData;
  note?: string | null;
  onNavigate?: () => void;
}) {
  const variant = product.variant;
  const purchasable = product.availability === "IN_STOCK" || product.availability === "LOW_STOCK";
  return (
    <div className="flex items-center gap-3.5">
      <Link
        href={`/urun/${product.slug}`}
        onClick={onNavigate}
        className="relative size-16 flex-none overflow-hidden rounded-xl"
        style={{ background: productTint(product.accentColor, 16) }}
      >
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="64px"
            className={product.image.fit === "cover" ? "object-cover" : "object-contain p-1.5 mix-blend-multiply"}
          />
        ) : null}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/urun/${product.slug}`} onClick={onNavigate} className="line-clamp-2 text-sm font-bold leading-snug text-cocoa-900 hover:text-bordeaux-600">
          {product.name}
        </Link>
        <p className="text-xs text-cocoa-500">
          {variant?.name}
          {variant && product.availability !== "COMING_SOON" ? ` · ${formatTRY(variant.priceKurus)}` : ""}
        </p>
        {note ? <p className="mt-0.5 text-xs italic text-caramel-700">{note}</p> : null}
      </div>
      {purchasable && variant ? (
        <AddToCartButton
          appearance="icon"
          variantId={variant.id}
          quantity={variant.minOrderQty}
          productName={product.name}
          priceKurus={variant.priceKurus}
        />
      ) : (
        <span className="text-xs font-semibold text-cocoa-400">{product.availability === "COMING_SOON" ? "Yakında" : "Tükendi"}</span>
      )}
    </div>
  );
}
