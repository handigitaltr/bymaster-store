import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, ShoppingBag } from "lucide-react";
import { fixCartAction } from "@/app/actions/cart";
import { CartLineControls } from "@/components/cart/CartLineControls";
import { CouponForm } from "@/components/cart/CouponForm";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { MiniProductRow } from "@/components/product/MiniProductRow";
import { productTint } from "@/components/product/ProductCard";
import { Alert } from "@/components/ui/Alert";
import { PackageBadge } from "@/components/ui/PackageBadge";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getCurrentUser } from "@/lib/auth/guards";
import { findCurrentCart, priceCart } from "@/lib/cart";
import { getPairings, type ProductCardData } from "@/lib/catalog";
import { formatTRY } from "@/lib/money";
import { getCheckoutReadiness } from "@/lib/orders";

export const metadata: Metadata = { title: "Sepetim", robots: { index: false, follow: false } };

export default async function CartPage() {
  const user = await getCurrentUser();
  const cart = await findCurrentCart(user);
  const priced = await priceCart(cart, { user });

  if (priced.lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <span className="mx-auto grid size-20 place-content-center rounded-full bg-cream-200 text-cocoa-700">
          <ShoppingBag className="size-8" aria-hidden="true" />
        </span>
        <h1 className="display-md mt-6 text-cocoa-900">Sepetiniz boş</h1>
        <p className="mx-auto mt-3 max-w-md text-cocoa-600">Waffle soslarından evde tatlı kitlerine, sunumlarınız için ihtiyacınız olanı keşfedin.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/urunler" className="btn btn-primary">
            Ürünleri keşfet
          </Link>
          <Link href="/kategori/evde-tatli-kitleri" className="btn btn-outline">
            Evde tatlı kitleri
          </Link>
        </div>
      </div>
    );
  }

  const readiness = await getCheckoutReadiness();
  const shippingMissing = priced.totals.shippingStatus === "NOT_CONFIGURED";
  const canCheckout = readiness.ready && !shippingMissing && priced.problems.length === 0;

  // Sepetteki ilk ürün için tamamlayıcı öneriler (sepette olmayanlar)
  let suggestions: ProductCardData[] = [];
  const firstValid = priced.lines.find((line) => !line.problem);
  if (firstValid) {
    const inCart = new Set(priced.lines.map((line) => line.productId));
    const pairings = await getPairings(firstValid.productId, 8);
    suggestions = pairings.products.filter((product) => !inCart.has(product.id) && product.variant).slice(0, 3);
  }

  return (
    <div className="container-page pb-24 pt-10">
      <h1 className="display-lg text-cocoa-900">
        Sepetim <span className="font-sans text-lg font-semibold text-cocoa-500">({priced.itemCount} ürün)</span>
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          {priced.problems.length > 0 ? (
            <Alert tone="warning" title="Sepetinizdeki bazı ürünlerde değişiklik var" className="mb-6">
              <ul className="list-disc space-y-1 pl-4">
                {priced.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
              <form action={fixCartAction} className="mt-3">
                <SubmitButton variant="btn-primary" className="btn-sm" pendingLabel="Düzenleniyor…">
                  Sepeti düzenle
                </SubmitButton>
              </form>
            </Alert>
          ) : null}

          <ul className="divide-y divide-cocoa-800/10 border-y border-cocoa-800/10">
            {priced.lines.map((line) => (
              <li key={line.itemId} className="grid grid-cols-[5.5rem_1fr] gap-4 py-5 sm:grid-cols-[7rem_1fr]">
                <Link
                  href={`/urun/${line.slug}`}
                  className="relative aspect-square overflow-hidden rounded-xl"
                  style={{ background: productTint(null, 14) }}
                >
                  {line.imageUrl ? (
                    <Image
                      src={line.imageUrl}
                      alt={line.imageAlt}
                      fill
                      sizes="112px"
                      className={line.imageFit === "cover" ? "object-cover" : "object-contain p-2 mix-blend-multiply"}
                    />
                  ) : null}
                </Link>
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-caramel-700">{line.categoryName}</p>
                    <Link href={`/urun/${line.slug}`} className="mt-1 block font-display text-lg leading-snug text-cocoa-900 hover:text-bordeaux-600">
                      {line.productName}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <PackageBadge packageType={line.packageType} netWeightGrams={line.netWeightGrams} />
                      <span className="text-xs text-cocoa-500 tabular-nums">Birim: {formatTRY(line.unitPriceKurus)}</span>
                      {line.unitPriceKurus < line.listPriceKurus ? (
                        <span className="text-xs font-bold text-success">Size özel fiyat</span>
                      ) : null}
                    </div>
                    {line.problem ? <p className="mt-2 text-xs font-bold text-danger">{line.problem}</p> : null}
                    <div className="mt-3">
                      <CartLineControls
                        variantId={line.variantId}
                        quantity={line.quantity}
                        min={line.minQty}
                        max={line.maxQty}
                        productName={line.productName}
                      />
                    </div>
                  </div>
                  <p className="text-base font-extrabold tabular-nums text-cocoa-900 sm:text-right">
                    {line.problem ? <span className="text-sm font-semibold text-cocoa-400">—</span> : formatTRY(line.lineTotalKurus)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <Link href="/urunler" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cocoa-800">
            <span className="link-underline">Alışverişe devam et</span>
          </Link>

          {suggestions.length > 0 ? (
            <section className="mt-12 rounded-[1.4rem] bg-cream-200 p-6" aria-labelledby="sepet-oneri">
              <p className="eyebrow">Tamamlayıcı ürünler</p>
              <h2 id="sepet-oneri" className="mt-2 font-display text-2xl text-cocoa-900">
                Sunumunuzu tamamlayın
              </h2>
              <ul className="mt-4 divide-y divide-cocoa-800/10">
                {suggestions.map((product) => (
                  <li key={product.id} className="py-3">
                    <MiniProductRow product={product} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="lg:col-span-5 xl:col-span-4" aria-label="Sipariş özeti">
          <div className="space-y-6 rounded-[1.4rem] border border-cocoa-800/10 bg-cream-100 p-6 lg:sticky lg:top-28">
            <h2 className="font-display text-2xl text-cocoa-900">Sipariş özeti</h2>
            <OrderSummary totals={priced.totals} couponCode={priced.couponApplied ? priced.couponCode : null} />
            <CouponForm appliedCode={priced.couponCode} invalidMessage={priced.couponCode && !priced.couponApplied ? priced.couponMessage : null} />

            {!readiness.ready || shippingMissing ? (
              <Alert tone="info" title="Online sipariş yakında aktif">
                Sipariş altyapımızın kurulumu tamamlanıyor. Ürünler ve toplu alım hakkında bilgi almak için{" "}
                <Link href="/iletisim">bize ulaşabilir</Link> veya <Link href="/profesyonel/teklif">teklif isteyebilirsiniz</Link>.
                {user?.role === "ADMIN" ? (
                  <span className="mt-2 block text-xs">
                    Yönetici notu: {[...readiness.problems, ...(shippingMissing ? ["Kargo ücreti tanımlanmadı"] : [])].join(" · ")}
                  </span>
                ) : null}
              </Alert>
            ) : null}

            {canCheckout ? (
              <Link href="/odeme" className="btn btn-lg btn-accent btn-block">
                Ödemeye geç <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <button type="button" disabled className="btn btn-lg btn-accent btn-block">
                Ödemeye geç
              </button>
            )}
            <p className="flex items-center justify-center gap-1.5 text-xs text-cocoa-500">
              <Lock className="size-3.5" aria-hidden="true" /> Fiyat ve stoklar ödeme adımında yeniden doğrulanır.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
