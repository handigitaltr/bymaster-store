import "server-only";
import type { EditorProduct } from "@/lib/product-editor";
import { db } from "@/lib/db";
import { kurusToInput } from "@/lib/money";

export async function getEditorOptions() {
  const [categories, tags, products] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.tag.findMany({ orderBy: [{ type: "asc" }, { sortOrder: "asc" }], select: { id: true, name: true, type: true } }),
    db.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { categories, tags, products };
}

export async function loadEditorProduct(id: string): Promise<EditorProduct | null> {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      categories: true,
      tags: true,
      relations: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) return null;
  const s = (value: string | null) => value ?? "";
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    subtitle: s(product.subtitle),
    brand: s(product.brand),
    kind: product.kind as EditorProduct["kind"],
    status: product.status as EditorProduct["status"],
    saleStatus: product.saleStatus as EditorProduct["saleStatus"],
    primaryCategoryId: product.primaryCategoryId,
    categoryIds: product.categories.map((c) => c.categoryId).filter((id) => id !== product.primaryCategoryId),
    shortDescription: s(product.shortDescription),
    description: s(product.description),
    ingredients: s(product.ingredients),
    allergens: s(product.allergens),
    mayContain: s(product.mayContain),
    storageConditions: s(product.storageConditions),
    shelfLife: s(product.shelfLife),
    usageAreasText: s(product.usageAreasText),
    usageTips: s(product.usageTips),
    kitContents: s(product.kitContents),
    kitPreparation: s(product.kitPreparation),
    servingInfo: s(product.servingInfo),
    originInfo: s(product.originInfo),
    accentColor: s(product.accentColor),
    isFeatured: product.isFeatured,
    freeShipping: product.freeShipping,
    sortOrder: String(product.sortOrder),
    seoTitle: s(product.seoTitle),
    seoDescription: s(product.seoDescription),
    tagIds: product.tags.map((t) => t.tagId),
    relatedIds: product.relations.map((r) => r.targetId),
    images: product.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      isPlaceholder: image.isPlaceholder,
      fit: image.fit === "cover" ? "cover" : "contain",
      kind: (["PACKSHOT", "DETAIL", "LIFESTYLE"].includes(image.kind) ? image.kind : "PACKSHOT") as "PACKSHOT" | "DETAIL" | "LIFESTYLE",
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      key: variant.id,
      sku: variant.sku,
      name: variant.name,
      packageType: variant.packageType,
      netWeightGrams: variant.netWeightGrams ? String(variant.netWeightGrams) : "",
      unitsPerCase: variant.unitsPerCase ? String(variant.unitsPerCase) : "",
      price: kurusToInput(variant.priceKurus),
      compareAtPrice: kurusToInput(variant.compareAtPriceKurus),
      vatRate: String(variant.vatRate),
      trackStock: variant.trackStock,
      initialStock: "0",
      stock: variant.stock,
      lowStockThreshold: String(variant.lowStockThreshold),
      minOrderQty: String(variant.minOrderQty),
      maxOrderQty: variant.maxOrderQty ? String(variant.maxOrderQty) : "",
      servingGrams: variant.servingGrams ? String(variant.servingGrams) : "",
      isActive: variant.isActive,
      isDefault: variant.isDefault,
    })),
  };
}
