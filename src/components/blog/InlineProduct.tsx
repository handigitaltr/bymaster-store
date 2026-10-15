import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { productTint } from "@/components/product/ProductCard";
import { PackageBadge } from "@/components/ui/PackageBadge";
import type { ProductCardData } from "@/lib/catalog";
import { formatTRY } from "@/lib/money";

/** Yazı gövdesine yerleştirilen, sepete eklenebilir ürün kartı */
export function InlineProduct({ product }: { product: ProductCardData }) {
  const variant = product.variant;
  const purchasable = product.availability === "IN_STOCK" || product.availability === "LOW_STOCK";
  return (
    <aside className="not-prose my-10 grid grid-cols-[6.5rem_1fr] items-center gap-5 rounded-[1.4rem] border border-cocoa-800/10 bg-cream-100 p-4 sm:grid-cols-[8rem_1fr_auto] sm:p-5">
      <Link href={`/urun/${product.slug}`} className="relative aspect-square overflow-hidden rounded-xl" style={{ background: productTint(product.accentColor, 14) }}>
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="128px"
            className={product.image.fit === "cover" ? "object-cover" : "object-contain p-2 mix-blend-multiply"}
          />
        ) : null}
      </Link>
      <div className="min-w-0">
        <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-caramel-700">Bu yazıda geçen ürün</p>
        <Link href={`/urun/${product.slug}`} className="mt-1 block font-display text-xl leading-snug text-cocoa-900 hover:text-bordeaux-600">
          {product.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {variant ? <PackageBadge packageType={variant.packageType} netWeightGrams={variant.netWeightGrams} /> : null}
          {variant && product.availability !== "COMING_SOON" ? (
            <span className="text-sm font-extrabold tabular-nums text-cocoa-900">{formatTRY(variant.priceKurus)}</span>
          ) : (
            <span className="text-sm font-bold text-bordeaux-600">Yakında</span>
          )}
        </div>
      </div>
      <div className="col-span-2 sm:col-span-1 sm:w-44">
        {purchasable && variant ? (
          <AddToCartButton appearance="compact" variantId={variant.id} quantity={variant.minOrderQty} productName={product.name} priceKurus={variant.priceKurus} />
        ) : (
          <Link href={`/urun/${product.slug}`} className="btn btn-sm btn-outline w-full">
            İncele
          </Link>
        )}
      </div>
    </aside>
  );
}
