import "server-only";
import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { db } from "@/lib/db";
import { variantAvailability, type Availability } from "@/lib/availability";
import { unitPricePerKg } from "@/lib/money";
import { searchTerms } from "@/lib/text";

export const ACTIVE_PRODUCT: Prisma.ProductWhereInput = { status: "ACTIVE" };

export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  subtitle: true,
  brand: true,
  kind: true,
  saleStatus: true,
  accentColor: true,
  freeShipping: true,
  isFeatured: true,
  shortDescription: true,
  primaryCategory: { select: { slug: true, name: true } },
  images: {
    orderBy: { sortOrder: "asc" },
    take: 2,
    select: { url: true, alt: true, isPlaceholder: true, fit: true, width: true, height: true },
  },
  variants: {
    where: { isActive: true },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      name: true,
      packageType: true,
      netWeightGrams: true,
      unitsPerCase: true,
      priceKurus: true,
      compareAtPriceKurus: true,
      vatRate: true,
      trackStock: true,
      stock: true,
      lowStockThreshold: true,
      minOrderQty: true,
      maxOrderQty: true,
    },
  },
  tags: { select: { tag: { select: { type: true, slug: true, name: true, color: true } } } },
} satisfies Prisma.ProductSelect;

export type ProductCardRecord = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

/** İstemci bileşenlerine aktarılabilen sade ürün kartı verisi */
export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  kind: string;
  categoryName: string;
  categorySlug: string;
  accentColor: string | null;
  freeShipping: boolean;
  shortDescription: string | null;
  image: { url: string; alt: string; isPlaceholder: boolean; fit: string } | null;
  hoverImage: { url: string; alt: string; isPlaceholder: boolean; fit: string } | null;
  variant: {
    id: string;
    name: string;
    packageType: string;
    netWeightGrams: number | null;
    unitsPerCase: number | null;
    priceKurus: number;
    compareAtPriceKurus: number | null;
    unitPricePerKgKurus: number | null;
    minOrderQty: number;
  } | null;
  variantCount: number;
  availability: Availability;
  stockLeft: number | null;
  flavors: { slug: string; name: string; color: string | null }[];
  usages: { slug: string; name: string }[];
};

export function toProductCard(product: ProductCardRecord): ProductCardData {
  const variant = product.variants[0] ?? null;
  const availability: Availability = variant
    ? variantAvailability(variant, product.saleStatus)
    : product.saleStatus === "COMING_SOON"
      ? "COMING_SOON"
      : "OUT_OF_STOCK";
  const [first, second] = product.images;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    kind: product.kind,
    categoryName: product.primaryCategory.name,
    categorySlug: product.primaryCategory.slug,
    accentColor: product.accentColor,
    freeShipping: product.freeShipping,
    shortDescription: product.shortDescription,
    image: first ? { url: first.url, alt: first.alt, isPlaceholder: first.isPlaceholder, fit: first.fit } : null,
    hoverImage: second && !second.isPlaceholder ? { url: second.url, alt: second.alt, isPlaceholder: false, fit: second.fit } : null,
    variant: variant
      ? {
          id: variant.id,
          name: variant.name,
          packageType: variant.packageType,
          netWeightGrams: variant.netWeightGrams,
          unitsPerCase: variant.unitsPerCase,
          priceKurus: variant.priceKurus,
          compareAtPriceKurus:
            variant.compareAtPriceKurus && variant.compareAtPriceKurus > variant.priceKurus
              ? variant.compareAtPriceKurus
              : null,
          unitPricePerKgKurus: unitPricePerKg(variant.priceKurus, variant.netWeightGrams),
          minOrderQty: variant.minOrderQty,
        }
      : null,
    variantCount: product.variants.length,
    availability,
    stockLeft: variant && variant.trackStock && availability === "LOW_STOCK" ? variant.stock : null,
    flavors: product.tags
      .filter((t) => t.tag.type === "FLAVOR")
      .map((t) => ({ slug: t.tag.slug, name: t.tag.name, color: t.tag.color })),
    usages: product.tags.filter((t) => t.tag.type === "USAGE").map((t) => ({ slug: t.tag.slug, name: t.tag.name })),
  };
}

export const SORT_OPTIONS = {
  onerilen: { label: "Önerilen sıralama" },
  "fiyat-artan": { label: "Fiyat: düşükten yükseğe" },
  "fiyat-azalan": { label: "Fiyat: yüksekten düşüğe" },
  "a-z": { label: "Ada göre (A–Z)" },
  "z-a": { label: "Ada göre (Z–A)" },
  yeni: { label: "En yeniler" },
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;

export type ProductFilters = {
  categorySlug?: string;
  flavor?: string[];
  usage?: string[];
  packageType?: string[];
  inStock?: boolean;
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export type Facet = { value: string; label: string; count: number; color?: string | null };

const PACKAGE_FACET_LABELS: Record<string, string> = {
  KOVA: "Kova (profesyonel)",
  PAKET: "Paket",
  KUTU: "Kutu / kit",
  SISE: "Şişe",
  KOLI: "Koli",
};

/**
 * Katalog gezintisi: temel küme (kategori + arama) veritabanından alınır; lezzet, kullanım, ambalaj ve stok
 * filtreleri ile yüzey (facet) sayıları bellekte hesaplanır. Katalog boyutu için hızlı ve tutarlıdır.
 */
export async function browseCatalog(filters: ProductFilters) {
  const and: Prisma.ProductWhereInput[] = [ACTIVE_PRODUCT];
  if (filters.categorySlug) and.push({ categories: { some: { category: { slug: filters.categorySlug, isActive: true } } } });
  if (filters.q) {
    const terms = searchTerms(filters.q);
    if (terms.length === 0) and.push({ id: "__bos__" });
    for (const term of terms) and.push({ searchText: { contains: term } });
  }
  const records = await db.product.findMany({
    where: { AND: and },
    select: { ...productCardSelect, sortOrder: true, createdAt: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const base = records.map((record) => ({ card: toProductCard(record), sortOrder: record.sortOrder, createdAt: record.createdAt }));

  const matches = (entry: (typeof base)[number], skip?: "flavor" | "usage" | "package" | "stock") => {
    const card = entry.card;
    if (skip !== "flavor" && filters.flavor?.length && !card.flavors.some((f) => filters.flavor!.includes(f.slug))) return false;
    if (skip !== "usage" && filters.usage?.length && !card.usages.some((u) => filters.usage!.includes(u.slug))) return false;
    if (skip !== "package" && filters.packageType?.length && !(card.variant && filters.packageType.includes(card.variant.packageType))) return false;
    if (skip !== "stock" && filters.inStock && !(card.availability === "IN_STOCK" || card.availability === "LOW_STOCK")) return false;
    return true;
  };

  // Yüzey sayıları: her grup kendi seçimi hariç diğer filtrelerle hesaplanır
  const flavorCounts = new Map<string, Facet>();
  const usageCounts = new Map<string, Facet>();
  const packageCounts = new Map<string, Facet>();
  let inStockCount = 0;
  for (const entry of base) {
    const card = entry.card;
    if (matches(entry, "flavor")) {
      for (const flavor of card.flavors) {
        const current = flavorCounts.get(flavor.slug) ?? { value: flavor.slug, label: flavor.name, color: flavor.color, count: 0 };
        current.count++;
        flavorCounts.set(flavor.slug, current);
      }
    }
    if (matches(entry, "usage")) {
      for (const usage of card.usages) {
        const current = usageCounts.get(usage.slug) ?? { value: usage.slug, label: usage.name, count: 0 };
        current.count++;
        usageCounts.set(usage.slug, current);
      }
    }
    if (matches(entry, "package") && card.variant) {
      const type = card.variant.packageType;
      const current = packageCounts.get(type) ?? { value: type, label: PACKAGE_FACET_LABELS[type] ?? type, count: 0 };
      current.count++;
      packageCounts.set(type, current);
    }
    if (matches(entry, "stock") && (card.availability === "IN_STOCK" || card.availability === "LOW_STOCK")) inStockCount++;
  }

  const filtered = base.filter((entry) => matches(entry));
  const price = (entry: (typeof base)[number]) => entry.card.variant?.priceKurus || Number.MAX_SAFE_INTEGER;
  const collator = new Intl.Collator("tr");
  switch (filters.sort ?? "onerilen") {
    case "fiyat-artan":
      filtered.sort((a, b) => price(a) - price(b));
      break;
    case "fiyat-azalan":
      filtered.sort((a, b) => (b.card.variant?.priceKurus ?? 0) - (a.card.variant?.priceKurus ?? 0));
      break;
    case "a-z":
      filtered.sort((a, b) => collator.compare(a.card.name, b.card.name));
      break;
    case "z-a":
      filtered.sort((a, b) => collator.compare(b.card.name, a.card.name));
      break;
    case "yeni":
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
    default: {
      // Satılabilir ürünler önce, ardından yönetici sıralaması
      const rank = (entry: (typeof base)[number]) =>
        entry.card.availability === "COMING_SOON" ? 2 : entry.card.availability === "OUT_OF_STOCK" ? 1 : 0;
      filtered.sort((a, b) => rank(a) - rank(b) || a.sortOrder - b.sortOrder);
    }
  }

  const pageSize = filters.pageSize ?? 12;
  const page = Math.max(1, filters.page ?? 1);
  const flavorOrder = await getTags("FLAVOR");
  const usageOrder = await getTags("USAGE");
  const byOrder = (order: { slug: string }[]) => (a: Facet, b: Facet) =>
    order.findIndex((o) => o.slug === a.value) - order.findIndex((o) => o.slug === b.value);

  return {
    items: filtered.slice(0, page * pageSize).map((entry) => entry.card),
    total: filtered.length,
    baseTotal: base.length,
    page,
    pageSize,
    hasMore: page * pageSize < filtered.length,
    facets: {
      flavors: Array.from(flavorCounts.values()).sort(byOrder(flavorOrder)),
      usages: Array.from(usageCounts.values()).sort(byOrder(usageOrder)),
      packageTypes: Array.from(packageCounts.values()).sort((a, b) => Object.keys(PACKAGE_FACET_LABELS).indexOf(a.value) - Object.keys(PACKAGE_FACET_LABELS).indexOf(b.value)),
      inStockCount,
    },
  };
}

export type CatalogPage = Awaited<ReturnType<typeof browseCatalog>>;

export const getActiveCategories = cache(async () =>
  db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      shortName: true,
      description: true,
      menuGroup: true,
      imageUrl: true,
      imageAlt: true,
      accentColor: true,
      _count: { select: { products: { where: { product: ACTIVE_PRODUCT } } } },
    },
  }),
);

export const getTags = cache(async (type: "FLAVOR" | "USAGE") =>
  db.tag.findMany({
    where: { type, products: { some: { product: ACTIVE_PRODUCT } } },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, color: true, description: true },
  }),
);

export async function getFeaturedProducts(limit = 8) {
  const records = await db.product.findMany({
    where: { ...ACTIVE_PRODUCT, isFeatured: true },
    select: productCardSelect,
    orderBy: [{ sortOrder: "asc" }],
    take: limit,
  });
  return records.map(toProductCard);
}

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const records = await db.product.findMany({
    where: { ...ACTIVE_PRODUCT, id: { in: ids.slice(0, 50) } },
    select: productCardSelect,
  });
  const byId = new Map(records.map((r) => [r.id, toProductCard(r)]));
  return ids.map((id) => byId.get(id)).filter((p): p is ProductCardData => Boolean(p));
}

export async function getProductsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  const records = await db.product.findMany({
    where: { ...ACTIVE_PRODUCT, slug: { in: slugs } },
    select: productCardSelect,
  });
  const bySlug = new Map(records.map((r) => [r.slug, toProductCard(r)]));
  return slugs.map((slug) => bySlug.get(slug)).filter((p): p is ProductCardData => Boolean(p));
}

export const getProductDetail = cache(async (slug: string) =>
  db.product.findFirst({
    where: { slug, ...ACTIVE_PRODUCT },
    include: {
      primaryCategory: { select: { slug: true, name: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }] },
      tags: { include: { tag: true } },
      blogPosts: {
        where: { post: { status: "PUBLISHED", publishedAt: { lte: new Date() } } },
        include: {
          post: {
            select: {
              slug: true,
              title: true,
              excerpt: true,
              coverImageUrl: true,
              coverImageAlt: true,
              readingMinutes: true,
              type: true,
            },
          },
        },
        take: 3,
      },
    },
  }),
);

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetail>>>;

/**
 * "Birlikte iyi gider" önerileri:
 *  1) Gerçek sipariş verisi yeterliyse (en az 3 ortak sipariş) birlikte sipariş edilenler,
 *  2) Yöneticinin belirlediği eşleşmeler,
 *  3) Aynı kullanım alanına sahip, farklı türde (sos ↔ süsleme) stoktaki ürünler.
 * Dönen `source`, başlıkta doğru ifadeyi kullanmak için kullanılır (uydurma iddia yok).
 */
export async function getPairings(productId: string, limit = 4) {
  const coPurchased = await db.$queryRaw<Array<{ productId: string; orders: bigint | number }>>`
    SELECT oi2."productId" AS "productId", COUNT(DISTINCT oi2."orderId") AS "orders"
    FROM "OrderItem" oi1
    JOIN "OrderItem" oi2 ON oi1."orderId" = oi2."orderId" AND oi2."productId" <> oi1."productId"
    JOIN "Order" o ON o."id" = oi1."orderId"
    WHERE oi1."productId" = ${productId}
      AND o."status" IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
      AND oi2."productId" IS NOT NULL
    GROUP BY oi2."productId"
    HAVING COUNT(DISTINCT oi2."orderId") >= 3
    ORDER BY "orders" DESC
    LIMIT ${limit}
  `;
  if (coPurchased.length >= 2) {
    const cards = await getProductsByIds(coPurchased.map((row) => row.productId));
    if (cards.length >= 2) return { source: "ORDERS" as const, products: cards.slice(0, limit) };
  }

  const curated = await db.productRelation.findMany({
    where: { sourceId: productId, target: ACTIVE_PRODUCT },
    orderBy: { sortOrder: "asc" },
    select: { targetId: true },
    take: limit,
  });
  if (curated.length > 0) {
    return { source: "CURATED" as const, products: await getProductsByIds(curated.map((c) => c.targetId)) };
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { primaryCategory: { select: { slug: true } }, tags: { select: { tag: { select: { type: true, slug: true } } } } },
  });
  if (!product) return { source: "RULES" as const, products: [] };
  const usageSlugs = product.tags.filter((t) => t.tag.type === "USAGE").map((t) => t.tag.slug);
  const isSauce = ["waffle-soslari", "cikolata-soslari", "meyveli-soslar"].includes(product.primaryCategory.slug);
  const complementCategories = isSauce
    ? ["pirinc-patlaklari", "krep-kiriklari", "sekerlemeler-ve-toppingler"]
    : ["waffle-soslari", "cikolata-soslari", "meyveli-soslar"];

  const records = await db.product.findMany({
    where: {
      ...ACTIVE_PRODUCT,
      id: { not: productId },
      saleStatus: "AVAILABLE",
      primaryCategory: { slug: { in: complementCategories } },
      ...(usageSlugs.length ? { tags: { some: { tag: { type: "USAGE", slug: { in: usageSlugs } } } } } : {}),
      variants: { some: { isActive: true, OR: [{ trackStock: false }, { stock: { gt: 0 } }] } },
      images: { some: { isPlaceholder: false } },
    },
    select: { ...productCardSelect, sortOrder: true },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    take: 24,
  });
  // Farklı kategorilerden dengeli seçim
  const picked: ProductCardRecord[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    if (picked.length >= limit) break;
    if (seen.has(record.primaryCategory.slug)) continue;
    seen.add(record.primaryCategory.slug);
    picked.push(record);
  }
  for (const record of records) {
    if (picked.length >= limit) break;
    if (!picked.includes(record)) picked.push(record);
  }
  return { source: "RULES" as const, products: picked.map(toProductCard) };
}

export async function getSimilarProducts(productId: string, categorySlug: string, limit = 4) {
  const records = await db.product.findMany({
    where: { ...ACTIVE_PRODUCT, id: { not: productId }, categories: { some: { category: { slug: categorySlug } } } },
    select: productCardSelect,
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    take: limit,
  });
  return records.map(toProductCard);
}

/** Header araması için hızlı sonuçlar */
export async function quickSearch(query: string, limit = 6) {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];
  const records = await db.product.findMany({
    where: { AND: [ACTIVE_PRODUCT, ...terms.map((term) => ({ searchText: { contains: term } }))] },
    select: productCardSelect,
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    take: limit,
  });
  return records.map(toProductCard);
}

const PACKAGING_GROUPS = [
  { slug: "waffle-soslari", label: "Waffle sosları" },
  { slug: "cikolata-soslari", label: "Çikolata bazı ve soslar" },
  { slug: "krep-kiriklari", label: "Krep kırıkları" },
  { slug: "pirinc-patlaklari", label: "Pirinç patlakları" },
  { slug: "sekerlemeler-ve-toppingler", label: "Şekerlemeler" },
  { slug: "waffle-mix-ve-karisimlar", label: "Waffle Mix" },
];

/** Profesyonel bölüm için kategori bazında ambalaj formatı ve güncel fiyat aralığı */
export const getPackagingSummary = cache(async () => {
  const rows = [];
  for (const group of PACKAGING_GROUPS) {
    const variants = await db.productVariant.findMany({
      where: {
        isActive: true,
        priceKurus: { gt: 0 },
        product: { ...ACTIVE_PRODUCT, saleStatus: "AVAILABLE", categories: { some: { category: { slug: group.slug } } } },
      },
      select: { priceKurus: true, packageType: true, netWeightGrams: true, unitsPerCase: true, productId: true },
    });
    if (variants.length === 0) continue;
    const formats = new Map<string, number>();
    for (const variant of variants) {
      const weight = variant.netWeightGrams
        ? variant.netWeightGrams >= 1000
          ? `${(variant.netWeightGrams / 1000).toLocaleString("tr-TR")} kg`
          : `${variant.netWeightGrams} g`
        : "";
      const label = `${weight} ${variant.packageType === "KOVA" ? "kova" : variant.packageType === "PAKET" ? "paket" : variant.packageType.toLowerCase()}${variant.unitsPerCase ? ` · koli içi ${variant.unitsPerCase}` : ""}`.trim();
      formats.set(label, (formats.get(label) ?? 0) + 1);
    }
    const format = Array.from(formats.entries()).sort((a, b) => b[1] - a[1])[0][0];
    rows.push({
      categorySlug: group.slug,
      label: group.label,
      format,
      minPriceKurus: Math.min(...variants.map((v) => v.priceKurus)),
      maxPriceKurus: Math.max(...variants.map((v) => v.priceKurus)),
      productCount: new Set(variants.map((v) => v.productId)).size,
    });
  }
  return rows;
});

/** Katalogdan doğrulanabilir sayılar (ana sayfa ve güven bölümü için) */
export const getCatalogFacts = cache(async () => {
  const [productCount, categoryCount, sauceCount, beadColors, kova] = await Promise.all([
    db.product.count({ where: ACTIVE_PRODUCT }),
    db.category.count({ where: { isActive: true, products: { some: { product: ACTIVE_PRODUCT } } } }),
    db.product.count({
      where: { ...ACTIVE_PRODUCT, categories: { some: { category: { slug: { in: ["waffle-soslari", "cikolata-soslari"] } } } } },
    }),
    db.product.count({ where: { ...ACTIVE_PRODUCT, primaryCategory: { slug: "pirinc-patlaklari" } } }),
    db.productVariant.findFirst({
      where: { isActive: true, packageType: "KOVA", product: ACTIVE_PRODUCT },
      select: { netWeightGrams: true },
      orderBy: { netWeightGrams: "desc" },
    }),
  ]);
  return { productCount, categoryCount, sauceCount, beadColors, largestKovaGrams: kova?.netWeightGrams ?? null };
});
