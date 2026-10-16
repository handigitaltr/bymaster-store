import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Briefcase, Truck } from "lucide-react";
import { PortionCalculator } from "@/components/product/PortionCalculator";
import { ProductCard, productTint } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { PurchasePanel, type PanelVariant } from "@/components/product/PurchasePanel";
import { TrackViewItem } from "@/components/product/TrackView";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { isPurchasable, maxPurchasableQty, variantAvailability } from "@/lib/availability";
import { getPairings, getProductDetail, getSimilarProducts } from "@/lib/catalog";
import { BLOG_POST_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatTRY, formatWeight, unitPricePerKg } from "@/lib/money";
import { pageMetadata, productJsonLd } from "@/lib/seo";
import { getSettings, LEGAL_PAGE_SLUGS } from "@/lib/settings";
import { STATIC_SITE } from "@/lib/site-mode";
import { truncate } from "@/lib/text";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  // Tam sitede sayfalar ilk istekte üretilir (ISR); statik vitrinde (GitHub Pages) hepsi derleme anında üretilir
  if (!STATIC_SITE) return [];
  const products = await db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true } });
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product) return { title: "Ürün bulunamadı" };
  const image = product.images.find((i) => !i.isPlaceholder) ?? null;
  return pageMetadata({
    title: product.seoTitle ?? `${product.name}${product.subtitle ? ` — ${product.subtitle}` : ""}`,
    description: product.seoDescription ?? truncate(product.shortDescription ?? product.description ?? product.name, 158),
    path: `/urun/${product.slug}`,
    image: image?.url,
    imageAlt: image?.alt,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductDetail(slug);
  if (!product) notFound();

  const [pairings, similar, settings, returnsPage] = await Promise.all([
    getPairings(product.id, 4),
    getSimilarProducts(product.id, product.primaryCategory.slug, 4),
    getSettings(),
    db.page.findFirst({ where: { slug: LEGAL_PAGE_SLUGS.returns, status: "PUBLISHED" }, select: { slug: true } }),
  ]);

  const variants: PanelVariant[] = product.variants.map((variant) => {
    const availability = variantAvailability(variant, product.saleStatus);
    return {
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      packageType: variant.packageType,
      netWeightGrams: variant.netWeightGrams,
      unitsPerCase: variant.unitsPerCase,
      priceKurus: variant.priceKurus,
      compareAtPriceKurus:
        variant.compareAtPriceKurus && variant.compareAtPriceKurus > variant.priceKurus ? variant.compareAtPriceKurus : null,
      unitPricePerKgKurus: unitPricePerKg(variant.priceKurus, variant.netWeightGrams),
      vatRate: variant.vatRate,
      availability: variant.priceKurus > 0 || availability === "COMING_SOON" ? availability : "OUT_OF_STOCK",
      stockLeft: variant.trackStock && availability === "LOW_STOCK" ? variant.stock : null,
      minQty: variant.minOrderQty,
      maxQty: maxPurchasableQty(variant),
    };
  });
  const primaryVariant = product.variants[0] ?? null;
  const usageTags = product.tags.filter((t) => t.tag.type === "USAGE").map((t) => t.tag.name);
  const flavorTags = product.tags.filter((t) => t.tag.type === "FLAVOR").map((t) => t.tag);
  const tint = productTint(product.accentColor, 12);

  const shippingText: string[] = [];
  if (product.freeShipping) shippingText.push("Bu üründe kargo ücretsiz. Sepetinizde kargo ücretine tabi başka ürünler de varsa standart kargo koşulları uygulanır.");
  else if (settings.shippingFeeKurus !== null) {
    shippingText.push(
      settings.shippingFeeKurus === 0
        ? "Kargo ücretsizdir."
        : `Kargo ücreti ${formatTRY(settings.shippingFeeKurus)}${
            settings.freeShippingThresholdKurus !== null ? `; ${formatTRY(settings.freeShippingThresholdKurus)} ve üzeri siparişlerde ücretsiz` : ""
          }.`,
    );
  }
  if (settings.dispatchTimeText) shippingText.push(settings.dispatchTimeText);

  const calculatorOptions = product.variants
    .filter((variant) => variant.netWeightGrams && variant.priceKurus > 0)
    .map((variant) => ({
      variantId: variant.id,
      label: product.name,
      netWeightGrams: variant.netWeightGrams as number,
      priceKurus: variant.priceKurus,
      servingGrams: variant.servingGrams,
      purchasable: isPurchasable(variantAvailability(variant, product.saleStatus)),
      packageLabel: `${formatWeight(variant.netWeightGrams)} ${variant.packageType === "KOVA" ? "kova" : "paket"}`,
    }));

  const isPro = primaryVariant?.packageType === "KOVA";

  return (
    <>
      <JsonLd
        data={productJsonLd({
          name: product.name,
          slug: product.slug,
          description: product.shortDescription ?? product.description ?? product.name,
          brand: product.brand,
          images: product.images.filter((i) => !i.isPlaceholder).map((i) => i.url),
          category: product.primaryCategory.name,
          variants: variants.map((v) => ({ sku: v.sku, priceKurus: v.priceKurus, availability: v.availability, netWeightGrams: v.netWeightGrams })),
        })}
      />
      {primaryVariant && primaryVariant.priceKurus > 0 ? (
        <TrackViewItem id={primaryVariant.id} name={product.name} priceKurus={primaryVariant.priceKurus} />
      ) : null}

      <div className="container-page pb-20 pt-6 lg:pt-8">
        <Breadcrumbs
          items={[
            { name: "Ürünler", path: "/urunler" },
            { name: product.primaryCategory.name, path: `/kategori/${product.primaryCategory.slug}` },
            { name: product.name, path: `/urun/${product.slug}` },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-28">
              <ProductGallery
                name={product.name}
                tint={tint}
                images={product.images.map((image) => ({ url: image.url, alt: image.alt, isPlaceholder: image.isPlaceholder, fit: image.fit }))}
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <Link href={`/kategori/${product.primaryCategory.slug}`} className="eyebrow hover:underline">
              {product.primaryCategory.name}
            </Link>
            <h1 className="mt-3 font-display text-[2.1rem] leading-[1.08] tracking-[-0.02em] text-cocoa-900 md:text-[2.6rem]">{product.name}</h1>
            {product.subtitle ? <p className="mt-2 text-base text-cocoa-500">{product.subtitle}</p> : null}
            {flavorTags.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {flavorTags.map((tag) => (
                  <li key={tag.slug}>
                    <Link
                      href={`/urunler?lezzet=${tag.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-cocoa-800/15 px-3 py-1 text-xs font-bold text-cocoa-700 hover:border-cocoa-800/40"
                    >
                      <span className="size-2.5 rounded-full" style={{ background: tag.color ?? "#BC8855" }} aria-hidden="true" />
                      {tag.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {product.shortDescription ? <p className="mt-5 text-[1.02rem] leading-relaxed text-cocoa-700">{product.shortDescription}</p> : null}

            <div className="mt-7">
              <PurchasePanel productId={product.id} productName={product.name} variants={variants} />
            </div>

            <div className="mt-7 space-y-3">
              {shippingText.length ? (
                <p className="flex gap-3 rounded-xl bg-cream-200 p-4 text-sm text-cocoa-700">
                  <Truck className="mt-0.5 size-4 flex-none text-caramel-700" aria-hidden="true" />
                  <span>{shippingText.join(" ")}</span>
                </p>
              ) : null}
              {isPro && !STATIC_SITE ? (
                <Link
                  href={`/profesyonel/teklif?urun=${primaryVariant?.id ?? ""}`}
                  className="group flex items-center gap-3 rounded-xl border border-cocoa-800/12 p-4 text-sm text-cocoa-700 hover:border-cocoa-800/35"
                >
                  <Briefcase className="size-4 flex-none text-caramel-700" aria-hidden="true" />
                  <span className="flex-1">
                    <strong className="text-cocoa-900">İşletmeniz için toplu alım mı planlıyorsunuz?</strong> Ürün ve miktarı iletin, size dönüş
                    yapalım.
                  </span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              ) : null}
            </div>

            <div className="mt-8">
              <ProductInfo
                product={product}
                variant={primaryVariant ? { packageType: primaryVariant.packageType, netWeightGrams: primaryVariant.netWeightGrams, unitsPerCase: primaryVariant.unitsPerCase, sku: primaryVariant.sku } : null}
                usageTags={usageTags}
                shippingText={shippingText}
                returnsHref={returnsPage ? `/sayfa/${returnsPage.slug}` : null}
              />
            </div>
          </div>
        </div>

        {calculatorOptions.length > 0 && product.kind !== "KIT" ? (
          <div className="mt-16">
            <PortionCalculator options={calculatorOptions} />
          </div>
        ) : null}

        {pairings.products.length > 0 ? (
          <section className="mt-20" aria-labelledby="birlikte">
            <p className="eyebrow mb-3">{pairings.source === "ORDERS" ? "Sipariş verilerine göre" : "Tamamlayıcı ürünler"}</p>
            <h2 id="birlikte" className="display-md text-cocoa-900">
              {pairings.source === "ORDERS" ? "Bu ürünle birlikte sipariş edilenler" : "Birlikte iyi gider"}
            </h2>
            <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
              {pairings.products.map((item) => (
                <li key={item.id}>
                  <ProductCard product={item} sizes="(min-width: 768px) 22vw, 46vw" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {product.blogPosts.length > 0 ? (
          <section className="mt-20 rounded-[1.6rem] bg-cream-200 p-6 sm:p-10" aria-labelledby="ilgili-tarifler">
            <p className="eyebrow mb-3">Lezzet Günlüğü</p>
            <h2 id="ilgili-tarifler" className="display-md text-cocoa-900">
              Bu ürünle hazırlayabileceğiniz tarifler
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {product.blogPosts.map(({ post }) => (
                <li key={post.slug}>
                  <Link href={`/tarifler/${post.slug}`} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-cream-300">
                      {post.coverImageUrl ? (
                        <Image src={post.coverImageUrl} alt={post.coverImageAlt ?? ""} fill sizes="(min-width: 768px) 30vw, 92vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : null}
                    </div>
                    <p className="mt-3 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-caramel-700">
                      {BLOG_POST_TYPE_LABELS[post.type]} · {post.readingMinutes} dk
                    </p>
                    <p className="mt-1 font-display text-xl leading-snug text-cocoa-900 group-hover:text-bordeaux-600">{post.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {similar.length > 0 ? (
          <section className="mt-20" aria-labelledby="benzer">
            <div className="flex items-end justify-between gap-4">
              <h2 id="benzer" className="display-md text-cocoa-900">
                Benzer ürünler
              </h2>
              <Link href={`/kategori/${product.primaryCategory.slug}`} className="text-sm font-bold text-cocoa-800 link-underline">
                Tümünü gör
              </Link>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
              {similar.map((item) => (
                <li key={item.id}>
                  <ProductCard product={item} sizes="(min-width: 768px) 22vw, 46vw" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
