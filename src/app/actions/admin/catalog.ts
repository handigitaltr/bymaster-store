"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { assertAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import type { AdminFormState } from "@/lib/admin-form";
import { recordStockChange } from "@/lib/inventory";
import { notifyBackInStock } from "@/lib/notifications";
import { revalidateStorefront } from "@/lib/revalidate";
import { slugify } from "@/lib/text";
import { checkboxBool, fieldErrors, formObject, z } from "@/lib/validation";

// ------------------------------------------------------------------ Kategoriler

const categorySchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(2, "Kategori adı girin.").max(80),
  shortName: z.string().trim().max(40).optional(),
  slug: z.string().trim().max(96).optional(),
  description: z.string().trim().max(500).optional(),
  menuGroup: z.string().trim().max(40).optional(),
  imageUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine((value) => !value || /^\/(images|media)\/[A-Za-z0-9/_.-]+$/.test(value), "Görsel yolu /images/ veya /media/ ile başlamalıdır."),
  imageAlt: z.string().trim().max(200).optional(),
  accentColor: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^#[0-9A-Fa-f]{6}$/.test(value), "Renk #RRGGBB biçiminde olmalıdır."),
  sortOrder: z.coerce.number().int().min(-10000).max(100000),
  isActive: checkboxBool,
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
});

export async function saveCategoryAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = categorySchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Lütfen alanları kontrol edin." };
  const { id, ...data } = parsed.data;
  const slug = slugify(data.slug || data.name);
  const owner = await db.category.findUnique({ where: { slug }, select: { id: true } });
  if (owner && owner.id !== id) return { errors: { slug: ["Bu adres başka bir kategoride kullanılıyor."] } };
  const values = {
    name: data.name,
    shortName: data.shortName || null,
    slug,
    description: data.description || null,
    menuGroup: data.menuGroup || null,
    imageUrl: data.imageUrl || null,
    imageAlt: data.imageAlt || null,
    accentColor: data.accentColor || null,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
  };
  const category = id ? await db.category.update({ where: { id }, data: values }) : await db.category.create({ data: values });
  await audit(admin.id, id ? "category.update" : "category.create", "Category", category.id, category.name);
  revalidateStorefront();
  revalidatePath("/yonetim/kategoriler");
  return { ok: true, message: "Kategori kaydedildi." };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = z.string().min(10).max(40).parse(formData.get("id"));
  const used = await db.product.count({ where: { OR: [{ primaryCategoryId: id }, { categories: { some: { categoryId: id } } }] } });
  if (used > 0) return; // ürünü olan kategori silinemez; arayüzde uyarı gösterilir
  await db.category.delete({ where: { id } });
  await audit(admin.id, "category.delete", "Category", id);
  revalidateStorefront();
  revalidatePath("/yonetim/kategoriler");
}

// ------------------------------------------------------------------ Stok

const stockSchema = z.object({
  variantId: z.string().min(10).max(40),
  mode: z.enum(["set", "add"]),
  amount: z.coerce.number().int().min(-1_000_000).max(1_000_000),
  reason: z.enum(["RESTOCK", "CORRECTION", "ADJUSTMENT", "RETURN"]),
  note: z.string().trim().max(200).optional(),
  trackStock: checkboxBool,
});

export async function updateStockAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = stockSchema.safeParse(formObject(formData));
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Geçersiz değer." };
  const { variantId, mode, amount, reason, note, trackStock } = parsed.data;
  const variant = await db.productVariant.findUnique({ where: { id: variantId }, include: { product: { select: { name: true, slug: true } } } });
  if (!variant) return { message: "Varyant bulunamadı." };
  const change = mode === "set" ? amount - variant.stock : amount;
  if (variant.stock + change < 0) return { message: "Stok eksiye düşemez." };

  const before = variant.stock;
  await db.$transaction(async (tx) => {
    if (variant.trackStock !== trackStock) await tx.productVariant.update({ where: { id: variantId }, data: { trackStock } });
    if (change !== 0) await recordStockChange(tx, { variantId, change, reason, note: note || null, actorId: admin.id });
  });
  await audit(admin.id, "inventory.update", "ProductVariant", variantId, `${variant.product.name}: ${before} → ${before + change}${trackStock ? "" : " (takip kapalı)"}`);
  if ((before <= 0 && before + change > 0) || (!variant.trackStock && trackStock && before + change > 0)) await notifyBackInStock([variantId]);
  revalidateStorefront();
  revalidatePath("/yonetim/stok");
  return { ok: true, message: `${variant.product.name} stoğu güncellendi: ${before + change}` };
}

const bulkPriceSchema = z.object({
  percent: z.coerce.number().min(-50, "En fazla %50 indirim uygulanabilir.").max(200, "En fazla %200 artış uygulanabilir."),
  categoryId: z.string().max(40).optional(),
  rounding: z.enum(["none", "1", "10", "50"]),
  confirm: z.literal("on", "Onay kutusunu işaretleyin."),
});

/** Toplu fiyat güncelleme: seçilen kategoride (veya tümünde) fiyatları yüzde ile değiştirir */
export async function bulkPriceAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = bulkPriceSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: parsed.error.issues[0]?.message };
  const { percent, categoryId, rounding } = parsed.data;
  if (percent === 0) return { message: "Değişim oranı 0 olamaz." };
  const variants = await db.productVariant.findMany({
    where: { priceKurus: { gt: 0 }, ...(categoryId ? { product: { categories: { some: { categoryId } } } } : {}) },
    select: { id: true, priceKurus: true },
  });
  const step = rounding === "none" ? 1 : Number(rounding) * 100;
  await db.$transaction(
    variants.map((variant) => {
      const raw = Math.round((variant.priceKurus * (100 + percent)) / 100);
      const priceKurus = Math.max(step, Math.round(raw / step) * step);
      return db.productVariant.update({ where: { id: variant.id }, data: { priceKurus, compareAtPriceKurus: null } });
    }),
  );
  await audit(admin.id, "price.bulk", "ProductVariant", null, `%${percent} · ${variants.length} varyant · ${categoryId ?? "tüm kategoriler"}`);
  revalidateStorefront();
  revalidatePath("/yonetim/stok");
  return { ok: true, message: `${variants.length} varyantın fiyatı %${percent} güncellendi. Önceki fiyat (indirim) alanları temizlendi.` };
}
