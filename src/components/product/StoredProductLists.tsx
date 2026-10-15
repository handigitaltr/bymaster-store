"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { PackageBadge } from "@/components/ui/PackageBadge";
import type { ProductCardData } from "@/lib/catalog";
import { formatTRY, formatWeight } from "@/lib/money";
import { COMPARE_KEY, COMPARE_MAX, FAVORITES_KEY, useStoredList } from "@/lib/use-stored-list";
import { ProductCard, productTint } from "./ProductCard";

/** Listedeki ürünleri getirir; liste boşsa istek atmaz, yeni liste yüklenirken eldeki ürünlerden uygun olanları gösterir */
function useProducts(ids: string[]) {
  const [loaded, setLoaded] = useState<{ key: string; products: ProductCardData[] } | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/urunler?ids=${encodeURIComponent(key)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((data: { products: ProductCardData[] }) => setLoaded({ key, products: data.products }))
      .catch(() => undefined);
    return () => controller.abort();
  }, [key]);
  if (!key) return [];
  if (!loaded) return null;
  return loaded.key === key ? loaded.products : loaded.products.filter((product) => ids.includes(product.id));
}

export function FavoritesList() {
  const favorites = useStoredList(FAVORITES_KEY);
  const products = useProducts(favorites.list);
  if (products === null) return <p className="text-cocoa-500">Yükleniyor…</p>;
  if (products.length === 0) {
    return (
      <div className="rounded-[1.6rem] bg-cream-200 px-6 py-16 text-center">
        <Heart className="mx-auto size-8 text-cocoa-400" aria-hidden="true" />
        <p className="mt-4 font-display text-2xl text-cocoa-900">Henüz favori ürününüz yok</p>
        <p className="mt-2 text-sm text-cocoa-600">Ürün kartlarındaki kalp simgesiyle favorilerinizi burada toplayabilirsiniz.</p>
        <Link href="/urunler" className="btn btn-primary mt-6">
          Ürünleri keşfet
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

export function CompareTable() {
  const compare = useStoredList(COMPARE_KEY, COMPARE_MAX);
  const products = useProducts(compare.list);
  if (products === null) return <p className="text-cocoa-500">Yükleniyor…</p>;
  if (products.length === 0) {
    return (
      <div className="rounded-[1.6rem] bg-cream-200 px-6 py-16 text-center">
        <p className="font-display text-2xl text-cocoa-900">Karşılaştırma listeniz boş</p>
        <p className="mt-2 text-sm text-cocoa-600">Ürün listelerinde “Karşılaştır” seçeneğiyle en fazla {COMPARE_MAX} ürün ekleyebilirsiniz.</p>
        <Link href="/urunler" className="btn btn-primary mt-6">
          Ürünlere git
        </Link>
      </div>
    );
  }
  const rows: Array<{ label: string; render: (p: ProductCardData) => React.ReactNode }> = [
    { label: "Kategori", render: (p) => p.categoryName },
    { label: "Ambalaj", render: (p) => (p.variant ? <PackageBadge packageType={p.variant.packageType} netWeightGrams={p.variant.netWeightGrams} /> : "—") },
    { label: "Net miktar", render: (p) => formatWeight(p.variant?.netWeightGrams) ?? "—" },
    { label: "Koli içi", render: (p) => (p.variant?.unitsPerCase ? `${p.variant.unitsPerCase} adet` : "—") },
    { label: "Fiyat (KDV dahil)", render: (p) => (p.variant && p.availability !== "COMING_SOON" ? <strong className="tabular-nums">{formatTRY(p.variant.priceKurus)}</strong> : "Yakında") },
    { label: "Kilogram fiyatı", render: (p) => (p.variant?.unitPricePerKgKurus ? formatTRY(p.variant.unitPricePerKgKurus) : "—") },
    { label: "Stok", render: (p) => <AvailabilityBadge availability={p.availability} stockLeft={p.stockLeft} /> },
    { label: "Lezzet ailesi", render: (p) => p.flavors.map((f) => f.name).join(", ") || "—" },
    { label: "Kullanım alanı", render: (p) => p.usages.map((u) => u.name).join(", ") || "—" },
  ];
  return (
    <div className="relative overflow-x-auto rounded-[1.4rem] border border-cocoa-800/10">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr>
            <th scope="col" className="w-40 bg-cream-100 p-4">
              <span className="sr-only">Özellik</span>
            </th>
            {products.map((product) => (
              <th key={product.id} scope="col" className="min-w-48 bg-cream-100 p-4 align-top font-normal">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => compare.remove(product.id)}
                    className="absolute -right-1 -top-1 grid size-8 place-content-center rounded-full bg-cream-50 text-cocoa-500 hover:text-bordeaux-600"
                    aria-label={`${product.name} karşılaştırmadan çıkar`}
                  >
                    <X className="size-4" />
                  </button>
                  <Link href={`/urun/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-xl" style={{ background: productTint(product.accentColor, 14) }}>
                    {product.image ? (
                      <Image src={product.image.url} alt="" fill sizes="192px" className={product.image.fit === "cover" ? "object-cover" : "object-contain p-3 mix-blend-multiply"} />
                    ) : null}
                  </Link>
                  <Link href={`/urun/${product.slug}`} className="mt-3 block font-display text-lg leading-snug text-cocoa-900 hover:text-bordeaux-600">
                    {product.name}
                  </Link>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cocoa-800/8">
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="bg-cream-50 p-4 font-bold text-cocoa-700">
                {row.label}
              </th>
              {products.map((product) => (
                <td key={product.id} className="p-4 text-cocoa-800">
                  {row.render(product)}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th scope="row" className="bg-cream-50 p-4">
              <span className="sr-only">Sepet</span>
            </th>
            {products.map((product) => (
              <td key={product.id} className="p-4">
                {product.variant && (product.availability === "IN_STOCK" || product.availability === "LOW_STOCK") ? (
                  <AddToCartButton appearance="compact" variantId={product.variant.id} quantity={product.variant.minOrderQty} productName={product.name} priceKurus={product.variant.priceKurus} />
                ) : null}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
