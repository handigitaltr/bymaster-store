import Image from "next/image";
import Link from "next/link";
import { Truck } from "lucide-react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { PackageBadge, WeightStamp } from "@/components/ui/PackageBadge";
import { Price } from "@/components/ui/Price";
import type { ProductCardData } from "@/lib/catalog";
import { formatTRY } from "@/lib/money";
import { cx } from "@/lib/utils";
import { CompareToggle, FavoriteButton } from "./ListToggles";

export function productTint(accent: string | null | undefined, strength = 13) {
  return `color-mix(in oklab, ${accent ?? "#BC8855"} ${strength}%, #FBF6EF)`;
}

export function ProductCard({
  product,
  priority = false,
  sizes = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw",
  showCompare = false,
  className,
}: {
  product: ProductCardData;
  priority?: boolean;
  sizes?: string;
  showCompare?: boolean;
  className?: string;
}) {
  const variant = product.variant;
  const purchasable = product.availability === "IN_STOCK" || product.availability === "LOW_STOCK";
  const href = `/urun/${product.slug}`;
  const imageClass = (fit: string | undefined) =>
    fit === "cover" ? "object-cover" : "object-contain p-[9%] mix-blend-multiply";

  return (
    <article className={cx("group relative flex h-full flex-col", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl" style={{ background: productTint(product.accentColor) }}>
        {/* Not: burada z-index verilmemeli; aksi halde mix-blend-multiply kart zeminiyle karışmaz */}
        <Link href={href} className="absolute inset-0" tabIndex={-1} aria-hidden="true">
          {product.image ? (
            <Image
              src={product.image.url}
              alt=""
              fill
              priority={priority}
              sizes={sizes}
              className={cx(
                imageClass(product.image.fit),
                "transition duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.045]",
                product.hoverImage && "group-hover:opacity-0",
              )}
            />
          ) : null}
          {product.hoverImage ? (
            <Image
              src={product.hoverImage.url}
              alt=""
              fill
              sizes={sizes}
              className={cx(imageClass(product.hoverImage.fit), "opacity-0 transition duration-700 group-hover:opacity-100")}
            />
          ) : null}
        </Link>
        {variant ? (
          <div className="pointer-events-none absolute left-3 top-3">
            <PackageBadge packageType={variant.packageType} netWeightGrams={variant.netWeightGrams} />
          </div>
        ) : null}
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton productId={product.id} productName={product.name} />
        </div>
        {variant ? (
          <div className="pointer-events-none absolute bottom-3 right-3">
            <WeightStamp packageType={variant.packageType} netWeightGrams={variant.netWeightGrams} />
          </div>
        ) : null}
        {product.image?.isPlaceholder ? (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-cream-50/90 px-2.5 py-1 text-[0.65rem] font-bold text-cocoa-600">
            Temsili görsel
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="eyebrow !text-[0.62rem] !tracking-[0.16em]">{product.categoryName}</p>
        <h3 className="mt-1.5 font-display text-[1.12rem] leading-snug text-cocoa-900">
          <Link href={href} className="link-reveal">
            {product.name}
          </Link>
        </h3>
        {product.subtitle ? <p className="mt-1 text-sm text-cocoa-500">{product.subtitle}</p> : null}
        {product.freeShipping ? (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-success">
            <Truck className="size-3.5" aria-hidden="true" /> Kargo ücretsiz
          </p>
        ) : null}

        <div className="mt-auto pt-3">
          {variant && product.availability !== "COMING_SOON" ? (
            <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
              <div>
                <Price kurus={variant.priceKurus} compareAtKurus={variant.compareAtPriceKurus} />
                {variant.unitPricePerKgKurus && variant.netWeightGrams !== 1000 ? (
                  <p className="text-[0.7rem] text-cocoa-500 tabular-nums">Birim fiyat: {formatTRY(variant.unitPricePerKgKurus)}/kg</p>
                ) : null}
              </div>
              <AvailabilityBadge availability={product.availability} stockLeft={product.stockLeft} />
            </div>
          ) : (
            <p className="text-sm font-bold text-bordeaux-600">Yakında satışta</p>
          )}

          <div className="mt-3 flex items-center gap-3">
            {purchasable && variant && product.variantCount === 1 ? (
              <AddToCartButton
                appearance="compact"
                variantId={variant.id}
                quantity={variant.minOrderQty}
                productName={product.name}
                priceKurus={variant.priceKurus}
              />
            ) : (
              <Link href={href} className="btn btn-sm btn-outline w-full">
                {product.variantCount > 1 && purchasable
                  ? "Seçenekleri gör"
                  : product.availability === "COMING_SOON"
                    ? "İncele ve haber al"
                    : "Gelince haber ver"}
              </Link>
            )}
          </div>
          {showCompare ? (
            <div className="mt-2.5">
              <CompareToggle productId={product.id} productName={product.name} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
