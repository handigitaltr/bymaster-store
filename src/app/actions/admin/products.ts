"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { assertAdmin } from "@/lib/auth/guards";
import { PACKAGE_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import type { AdminFormState } from "@/lib/admin-form";
import { parseTRYToKurus } from "@/lib/money";
import { notifyBackInStock } from "@/lib/notifications";
import { revalidateStorefront } from "@/lib/revalidate";
import { normalizeForSearch, slugify } from "@/lib/text";
import { z } from "@/lib/validation";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

const imageSchema = z.object({
  url: z
    .string()
    .max(300)
    .regex(/^\/(media\/\d{4}\/\d{2}\/[A-Za-z0-9_-]+\.webp|images\/[a-z0-9/_-]+\.(webp|jpg|jpeg|png))$/, "Geçersiz görsel yolu."),
  alt: z.string().trim().min(2, "Görsel açıklaması (alt metin) girin.").max(200),
  isPlaceholder: z.boolean(),
  fit: z.enum(["contain", "cover"]),
  kind: z.enum(["PACKSHOT", "DETAIL", "LIFESTYLE"]),
});

const variantSchema = z.object({
  id: z.string().max(40).optional(),
  sku: z
    .string()
    .trim()
    .min(2, "Stok kodu girin.")
    .max(40)
    .regex(/^[A-Za-z0-9-_.]+$/, "Stok kodu yalnızca harf, rakam ve - _ . içerebilir."),
  name: z.string().trim().min(1, "Varyant adı girin.").max(60),
  packageType: z.enum(PACKAGE_TYPES),
  netWeightGrams: z.number().int().positive().max(1_000_000).nullable(),
  unitsPerCase: z.number().int().positive().max(10_000).nullable(),
  price: z.string().trim().max(20),
  compareAtPrice: z.string().trim().max(20).optional(),
  vatRate: z.number().int().refine((value) => [0, 1, 10, 20].includes(value), "KDV oranı 0, 1, 10 veya 20 olmalıdır."),
  trackStock: z.boolean(),
  initialStock: z.number().int().min(0).max(1_000_000).optional(),
  lowStockThreshold: z.number().int().min(0).max(100_000),
  minOrderQty: z.number().int().min(1).max(10_000),
  maxOrderQty: z.number().int().min(1).max(100_000).nullable(),
  servingGrams: z.number().int().positive().max(5000).nullable(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
});

const productSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(2, "Ürün adı girin.").max(140),
  slug: z.string().trim().max(96).optional(),
  subtitle: text(140),
  brand: text(60),
  kind: z.enum(["SIMPLE", "KIT"]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  saleStatus: z.enum(["AVAILABLE", "COMING_SOON"]),
  primaryCategoryId: z.string().min(1, "Birincil kategori seçin.").max(40),
  categoryIds: z.array(z.string().max(40)).max(20),
  shortDescription: text(300),
  description: text(8000),
  ingredients: text(3000),
  allergens: text(1000),
  mayContain: text(500),
  storageConditions: text(1000),
  shelfLife: text(200),
  usageAreasText: text(500),
  usageTips: text(2000),
  kitContents: text(2000),
  kitPreparation: text(2000),
  servingInfo: text(500),
  originInfo: text(200),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Renk #RRGGBB biçiminde olmalıdır.")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  isFeatured: z.boolean(),
  freeShipping: z.boolean(),
  sortOrder: z.number().int().min(-10_000).max(100_000),
  seoTitle: text(70),
  seoDescription: text(170),
  tagIds: z.array(z.string().max(40)).max(40),
  relatedIds: z.array(z.string().max(40)).max(12),
  images: z.array(imageSchema).max(20),
  variants: z.array(variantSchema).min(1, "En az bir varyant gerekli.").max(20),
});

export type ProductPayload = z.input<typeof productSchema>;

function fail(message: string, field?: string): AdminFormState {
  return { message, ...(field ? { errors: { [field]: [message] } } : {}) };
}

export async function saveProductAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const raw = String(formData.get("payload") ?? "");
  if (raw.length > 200_000) return fail("Veri çok büyük.");
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail("Geçersiz form verisi.");
  }
  const parsed = productSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(`${issue?.path.join(" › ") ? `${issue.path.join(" › ")}: ` : ""}${issue?.message ?? "Geçersiz veri."}`);
  }
  const data = parsed.data;

  const slug = slugify(data.slug || data.name);
  if (!slug) return fail("Geçerli bir adres (slug) girin.", "slug");
  const slugOwner = await db.product.findUnique({ where: { slug }, select: { id: true } });
  if (slugOwner && slugOwner.id !== data.id) return fail("Bu adres (slug) başka bir üründe kullanılıyor.", "slug");

  const existing = data.id
    ? await db.product.findUnique({ where: { id: data.id }, include: { variants: { include: { _count: { select: { orderItems: true } } } } } })
    : null;
  if (data.id && !existing) return fail("Ürün bulunamadı.");

  const categoryIds = Array.from(new Set([data.primaryCategoryId, ...data.categoryIds]));
  const categories = await db.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } });
  if (categories.length !== categoryIds.length) return fail("Seçilen kategorilerden biri bulunamadı.");
  const tags = await db.tag.findMany({ where: { id: { in: data.tagIds } }, select: { id: true, name: true } });
  const relatedIds = data.relatedIds.filter((id) => id !== data.id);
  const related = await db.product.findMany({ where: { id: { in: relatedIds } }, select: { id: true } });

  // Varyant kontrolleri
  const variants = data.variants.map((variant) => ({
    ...variant,
    priceKurus: parseTRYToKurus(variant.price || "0") ?? -1,
    compareAtPriceKurus: variant.compareAtPrice ? parseTRYToKurus(variant.compareAtPrice) : null,
  }));
  if (variants.some((variant) => variant.priceKurus < 0)) return fail("Fiyatlar 1234,50 biçiminde girilmelidir.");
  if (variants.some((variant) => variant.compareAtPriceKurus !== null && variant.compareAtPriceKurus !== undefined && variant.compareAtPriceKurus <= variant.priceKurus)) {
    return fail("Önceki fiyat, satış fiyatından yüksek olmalıdır (yalnızca gerçek bir indirimde kullanın).");
  }
  const skus = variants.map((variant) => variant.sku.toUpperCase());
  if (new Set(skus).size !== skus.length) return fail("Varyant stok kodları benzersiz olmalıdır.");
  const ownIds = new Set(existing?.variants.map((variant) => variant.id) ?? []);
  if (variants.some((variant) => variant.id && !ownIds.has(variant.id))) return fail("Geçersiz varyant.");
  const skuConflict = await db.productVariant.findFirst({
    where: { sku: { in: variants.map((variant) => variant.sku) }, ...(data.id ? { productId: { not: data.id } } : {}) },
    select: { sku: true },
  });
  if (skuConflict) return fail(`${skuConflict.sku} stok kodu başka bir üründe kullanılıyor.`);
  if (data.status === "ACTIVE" && data.saleStatus === "AVAILABLE" && !variants.some((variant) => variant.isActive && variant.priceKurus > 0)) {
    return fail("Satışta olan bir ürünün en az bir aktif varyantının fiyatı 0'dan büyük olmalıdır.");
  }
  if (variants.filter((variant) => variant.isDefault).length !== 1) {
    variants.forEach((variant, index) => (variant.isDefault = index === 0));
  }

  const searchText = normalizeForSearch(
    [data.name, data.subtitle, data.brand, ...variants.map((v) => `${v.sku} ${v.name}`), ...categories.map((c) => c.name), ...tags.map((t) => t.name)]
      .filter(Boolean)
      .join(" "),
  );

  const scalar = {
    slug,
    name: data.name,
    subtitle: data.subtitle,
    brand: data.brand,
    kind: data.kind,
    status: data.status,
    saleStatus: data.saleStatus,
    primaryCategoryId: data.primaryCategoryId,
    shortDescription: data.shortDescription,
    description: data.description,
    ingredients: data.ingredients,
    allergens: data.allergens,
    mayContain: data.mayContain,
    storageConditions: data.storageConditions,
    shelfLife: data.shelfLife,
    usageAreasText: data.usageAreasText,
    usageTips: data.usageTips,
    kitContents: data.kitContents,
    kitPreparation: data.kitPreparation,
    servingInfo: data.servingInfo,
    originInfo: data.originInfo,
    accentColor: data.accentColor ?? null,
    isFeatured: data.isFeatured,
    freeShipping: data.freeShipping,
    sortOrder: data.sortOrder,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    searchText,
    publishedAt: data.status === "ACTIVE" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
  };

  const restockedVariantIds: string[] = [];
  const productId = await db.$transaction(async (tx) => {
    const product = existing ? await tx.product.update({ where: { id: existing.id }, data: scalar }) : await tx.product.create({ data: scalar });

    await tx.productCategory.deleteMany({ where: { productId: product.id } });
    await tx.productCategory.createMany({ data: categoryIds.map((categoryId, index) => ({ productId: product.id, categoryId, sortOrder: index })) });
    await tx.productTag.deleteMany({ where: { productId: product.id } });
    if (tags.length) await tx.productTag.createMany({ data: tags.map((tag) => ({ productId: product.id, tagId: tag.id })) });
    await tx.productRelation.deleteMany({ where: { sourceId: product.id } });
    if (related.length) {
      await tx.productRelation.createMany({
        data: relatedIds.filter((id) => related.some((r) => r.id === id)).map((targetId, index) => ({ sourceId: product.id, targetId, type: "PAIRS_WITH", sortOrder: index })),
      });
    }
    await tx.productImage.deleteMany({ where: { productId: product.id } });
    if (data.images.length) {
      await tx.productImage.createMany({ data: data.images.map((image, index) => ({ ...image, productId: product.id, sortOrder: index })) });
    }

    const keptIds = new Set<string>();
    for (const [index, variant] of variants.entries()) {
      const fields = {
        sku: variant.sku,
        name: variant.name,
        packageType: variant.packageType,
        netWeightGrams: variant.netWeightGrams,
        unitsPerCase: variant.unitsPerCase,
        priceKurus: variant.priceKurus,
        compareAtPriceKurus: variant.compareAtPriceKurus ?? null,
        vatRate: variant.vatRate,
        trackStock: variant.trackStock,
        lowStockThreshold: variant.lowStockThreshold,
        minOrderQty: variant.minOrderQty,
        maxOrderQty: variant.maxOrderQty,
        servingGrams: variant.servingGrams,
        isActive: variant.isActive,
        isDefault: variant.isDefault,
        sortOrder: index,
      };
      if (variant.id) {
        await tx.productVariant.update({ where: { id: variant.id }, data: fields });
        keptIds.add(variant.id);
      } else {
        const stock = variant.trackStock ? (variant.initialStock ?? 0) : 0;
        const created = await tx.productVariant.create({ data: { ...fields, productId: product.id, stock } });
        keptIds.add(created.id);
        if (stock > 0) {
          await tx.inventoryMovement.create({
            data: { variantId: created.id, change: stock, stockAfter: stock, reason: "RESTOCK", note: "Başlangıç stoğu", actorId: admin.id },
          });
        }
      }
    }
    for (const old of existing?.variants ?? []) {
      if (keptIds.has(old.id)) continue;
      // Sipariş geçmişi olan varyant silinmez, pasife alınır
      if (old._count.orderItems > 0) await tx.productVariant.update({ where: { id: old.id }, data: { isActive: false } });
      else await tx.productVariant.delete({ where: { id: old.id } });
    }
    if (existing?.saleStatus === "COMING_SOON" && data.saleStatus === "AVAILABLE") restockedVariantIds.push(...keptIds);
    return product.id;
  });

  await audit(admin.id, existing ? "product.update" : "product.create", "Product", productId, data.name);
  if (restockedVariantIds.length) await notifyBackInStock(restockedVariantIds);
  revalidateStorefront();
  revalidatePath("/yonetim/urunler");
  if (!existing) redirect(`/yonetim/urunler/${productId}?kaydedildi=1`);
  return { ok: true, message: "Ürün kaydedildi." };
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = z.string().min(10).max(40).parse(formData.get("id"));
  const product = await db.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
  if (!product) redirect("/yonetim/urunler");
  if (product._count.orderItems > 0) {
    // Sipariş geçmişi korunur: ürün silinmez, arşive alınır
    await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    await audit(admin.id, "product.archive", "Product", id, product.name);
  } else {
    await db.product.delete({ where: { id } });
    await audit(admin.id, "product.delete", "Product", id, product.name);
  }
  revalidateStorefront();
  redirect("/yonetim/urunler");
}

export async function setProductStatusAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const parsed = z.object({ id: z.string().min(10).max(40), status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const product = await db.product.findUnique({ where: { id: parsed.data.id }, include: { variants: { where: { isActive: true } } } });
  if (!product) return;
  if (parsed.data.status === "ACTIVE" && product.saleStatus === "AVAILABLE" && !product.variants.some((variant) => variant.priceKurus > 0)) return;
  await db.product.update({
    where: { id: product.id },
    data: { status: parsed.data.status, publishedAt: parsed.data.status === "ACTIVE" ? (product.publishedAt ?? new Date()) : product.publishedAt },
  });
  await audit(admin.id, `product.status.${parsed.data.status.toLowerCase()}`, "Product", product.id, product.name);
  revalidateStorefront();
  revalidatePath("/yonetim/urunler");
}
