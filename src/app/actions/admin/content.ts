"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { assertAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { parseLocalDateTime, type AdminFormState } from "@/lib/admin-form";
import { revalidateStorefront } from "@/lib/revalidate";
import { SYSTEM_PAGE_SLUGS } from "@/lib/settings";
import { normalizeForSearch, readingMinutes, slugify } from "@/lib/text";
import { checkboxBool, fieldErrors, formObject, z } from "@/lib/validation";

const imagePath = z
  .string()
  .trim()
  .max(300)
  .optional()
  .refine((value) => !value || /^\/(images|media)\/[A-Za-z0-9/_.-]+$/.test(value), "Görsel yolu /images/ veya /media/ ile başlamalıdır.");

// ------------------------------------------------------------------ Blog yazıları

const postSchema = z.object({
  id: z.string().max(40).optional(),
  title: z.string().trim().min(5, "Başlık en az 5 karakter olmalıdır.").max(160),
  slug: z.string().trim().max(96).optional(),
  type: z.enum(["ARTICLE", "RECIPE", "GUIDE"]),
  categoryId: z.string().max(40).optional(),
  tags: z.string().trim().max(300).optional(),
  excerpt: z.string().trim().min(20, "Giriş paragrafı en az 20 karakter olmalıdır.").max(400),
  content: z.string().trim().min(50, "İçerik en az 50 karakter olmalıdır.").max(60000),
  coverImageUrl: imagePath,
  coverImageAlt: z.string().trim().max(200).optional(),
  coverCredit: z.string().trim().max(120).optional(),
  authorName: z.string().trim().min(2, "Yazar adı girin.").max(80),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.string().optional(),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
  recipeYield: z.string().trim().max(60).optional(),
  prepMinutes: z.string().trim().max(4).optional(),
  cookMinutes: z.string().trim().max(4).optional(),
  recipeIngredients: z.string().trim().max(4000).optional(),
  recipeSteps: z.string().trim().max(6000).optional(),
  products: z.string().max(5000).optional(), // JSON: [{productId, note}]
});

export async function saveBlogPostAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = postSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Lütfen işaretli alanları kontrol edin." };
  const data = parsed.data;
  const slug = slugify(data.slug || data.title);
  const owner = await db.blogPost.findUnique({ where: { slug }, select: { id: true } });
  if (owner && owner.id !== data.id) return { errors: { slug: ["Bu adres başka bir yazıda kullanılıyor."] } };
  if (data.categoryId && !(await db.blogCategory.findUnique({ where: { id: data.categoryId }, select: { id: true } }))) {
    return { errors: { categoryId: ["Kategori bulunamadı."] } };
  }
  if (data.coverImageUrl && !data.coverImageAlt) return { errors: { coverImageAlt: ["Kapak görseli için alt metin girin."] } };

  let products: Array<{ productId: string; note: string | null }> = [];
  try {
    const rawProducts = JSON.parse(data.products || "[]") as Array<{ productId?: unknown; note?: unknown }>;
    products = rawProducts
      .filter((p) => typeof p.productId === "string")
      .slice(0, 12)
      .map((p) => ({ productId: String(p.productId), note: typeof p.note === "string" && p.note.trim() ? p.note.trim().slice(0, 120) : null }));
  } catch {
    return { message: "Ürün listesi okunamadı." };
  }
  const validProducts = await db.product.findMany({ where: { id: { in: products.map((p) => p.productId) } }, select: { id: true } });
  const validIds = new Set(validProducts.map((p) => p.id));

  const tagNames = Array.from(new Set((data.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean))).slice(0, 10);
  const existing = data.id ? await db.blogPost.findUnique({ where: { id: data.id }, select: { id: true, publishedAt: true } }) : null;
  if (data.id && !existing) return { message: "Yazı bulunamadı." };

  const publishedAt =
    data.status === "PUBLISHED" ? (parseLocalDateTime(data.publishedAt ?? null) ?? existing?.publishedAt ?? new Date()) : parseLocalDateTime(data.publishedAt ?? null);
  const toInt = (value: string | undefined) => {
    const n = Number(value);
    return value && Number.isInteger(n) && n > 0 && n < 1000 ? n : null;
  };

  const values = {
    slug,
    title: data.title,
    type: data.type,
    categoryId: data.categoryId || null,
    excerpt: data.excerpt,
    content: data.content,
    coverImageUrl: data.coverImageUrl || null,
    coverImageAlt: data.coverImageAlt || null,
    coverCredit: data.coverCredit || null,
    authorName: data.authorName,
    status: data.status,
    publishedAt,
    readingMinutes: readingMinutes(data.content),
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    recipeYield: data.recipeYield || null,
    prepMinutes: toInt(data.prepMinutes),
    cookMinutes: toInt(data.cookMinutes),
    recipeIngredients: data.recipeIngredients || null,
    recipeSteps: data.recipeSteps || null,
  };

  const postId = await db.$transaction(async (tx) => {
    const post = existing ? await tx.blogPost.update({ where: { id: existing.id }, data: values }) : await tx.blogPost.create({ data: values });
    await tx.blogPostTag.deleteMany({ where: { postId: post.id } });
    for (const name of tagNames) {
      const tagSlug = normalizeForSearch(name).replace(/\s+/g, "-").slice(0, 60);
      if (!tagSlug) continue;
      const tag = await tx.blogTag.upsert({ where: { slug: tagSlug }, update: {}, create: { slug: tagSlug, name: name.slice(0, 40) } });
      await tx.blogPostTag.create({ data: { postId: post.id, tagId: tag.id } });
    }
    await tx.blogPostProduct.deleteMany({ where: { postId: post.id } });
    const rows = products.filter((p) => validIds.has(p.productId));
    const seen = new Set<string>();
    for (const [index, row] of rows.entries()) {
      if (seen.has(row.productId)) continue;
      seen.add(row.productId);
      await tx.blogPostProduct.create({ data: { postId: post.id, productId: row.productId, note: row.note, sortOrder: index } });
    }
    return post.id;
  });

  await audit(admin.id, existing ? "post.update" : "post.create", "BlogPost", postId, data.title);
  revalidateStorefront();
  revalidatePath("/yonetim/blog");
  if (!existing) redirect(`/yonetim/blog/${postId}?kaydedildi=1`);
  return { ok: true, message: data.status === "PUBLISHED" ? "Yazı kaydedildi ve yayında." : "Taslak kaydedildi (sitede görünmez)." };
}

export async function deleteBlogPostAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = z.string().min(10).max(40).parse(formData.get("id"));
  await db.blogPost.delete({ where: { id } });
  await audit(admin.id, "post.delete", "BlogPost", id);
  revalidateStorefront();
  redirect("/yonetim/blog");
}

const blogCategorySchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(2, "Ad girin.").max(60),
  slug: z.string().trim().max(60).optional(),
  description: z.string().trim().max(300).optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
});

export async function saveBlogCategoryAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = blogCategorySchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { id, ...data } = parsed.data;
  const slug = slugify(data.slug || data.name);
  const owner = await db.blogCategory.findUnique({ where: { slug }, select: { id: true } });
  if (owner && owner.id !== id) return { errors: { slug: ["Bu adres kullanılıyor."] } };
  const values = { ...data, slug, description: data.description || null, seoTitle: data.seoTitle || null, seoDescription: data.seoDescription || null };
  const category = id ? await db.blogCategory.update({ where: { id }, data: values }) : await db.blogCategory.create({ data: values });
  await audit(admin.id, "blogcategory.save", "BlogCategory", category.id, category.name);
  revalidateStorefront();
  revalidatePath("/yonetim/blog/kategoriler");
  return { ok: true, message: "Kategori kaydedildi." };
}

// ------------------------------------------------------------------ Sayfalar (yasal metinler dahil)

const pageSchema = z.object({
  id: z.string().max(40).optional(),
  title: z.string().trim().min(2, "Başlık girin.").max(120),
  slug: z.string().trim().max(96).optional(),
  kind: z.enum(["INFO", "LEGAL"]),
  content: z.string().trim().min(20, "İçerik çok kısa.").max(80000),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
});

export async function savePageAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = pageSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Lütfen alanları kontrol edin." };
  const { id, ...data } = parsed.data;
  const slug = slugify(data.slug || data.title);
  const owner = await db.page.findUnique({ where: { slug }, select: { id: true, publishedAt: true } });
  if (owner && owner.id !== id) return { errors: { slug: ["Bu adres kullanılıyor."] } };
  const existing = id ? await db.page.findUnique({ where: { id }, select: { publishedAt: true, slug: true } }) : null;
  if (id && !existing) return { message: "Sayfa bulunamadı." };
  if (existing && existing.slug !== slug && SYSTEM_PAGE_SLUGS.includes(existing.slug)) {
    return { errors: { slug: ["Bu sistem sayfasının adresi değiştirilemez."] } };
  }
  const values = {
    ...data,
    slug,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    publishedAt: data.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
  };
  const page = id ? await db.page.update({ where: { id }, data: values }) : await db.page.create({ data: values });
  await audit(admin.id, `page.${data.status === "PUBLISHED" ? "publish" : "save"}`, "Page", page.id, page.title);
  revalidateStorefront();
  revalidatePath("/yonetim/sayfalar");
  if (!id) redirect(`/yonetim/sayfalar/${page.id}`);
  return { ok: true, message: data.status === "PUBLISHED" ? "Sayfa yayında." : "Taslak kaydedildi." };
}

export async function deletePageAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = z.string().min(10).max(40).parse(formData.get("id"));
  const page = await db.page.findUnique({ where: { id }, select: { slug: true, title: true } });
  if (!page || SYSTEM_PAGE_SLUGS.includes(page.slug)) throw new Error("Sistem sayfaları silinemez; taslağa alabilirsiniz.");
  await db.page.delete({ where: { id } });
  await audit(admin.id, "page.delete", "Page", id, page.title);
  revalidateStorefront();
  redirect("/yonetim/sayfalar");
}

// ------------------------------------------------------------------ SSS

const faqSchema = z.object({
  id: z.string().max(40).optional(),
  question: z.string().trim().min(5, "Soru girin.").max(200),
  answer: z.string().trim().min(5, "Yanıt girin.").max(2000),
  group: z.string().trim().max(40).optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000),
  isPublished: checkboxBool,
});

export async function saveFaqAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = faqSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { id, ...data } = parsed.data;
  const values = { ...data, group: data.group || null };
  const item = id ? await db.faqItem.update({ where: { id }, data: values }) : await db.faqItem.create({ data: values });
  await audit(admin.id, "faq.save", "FaqItem", item.id);
  revalidateStorefront();
  revalidatePath("/yonetim/sayfalar");
  return { ok: true, message: "Kaydedildi." };
}

export async function deleteFaqAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = z.string().min(10).max(40).parse(formData.get("id"));
  await db.faqItem.delete({ where: { id } });
  await audit(admin.id, "faq.delete", "FaqItem", id);
  revalidateStorefront();
  revalidatePath("/yonetim/sayfalar");
}
