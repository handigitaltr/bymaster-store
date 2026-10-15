/**
 * Başlangıç verisi. Güvenli ve tekrar çalıştırılabilir:
 *  - Hiçbir kaydı silmez veya üzerine yazmaz; yalnızca eksik olanları (slug/sku/kod bazında) ekler.
 *  - Yönetici hesabı OLUŞTURMAZ (bilinen bir parola riski olmaması için) → npm run admin:create
 */
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { detectImageFit } from "../src/lib/image-fit";
import { normalizeForSearch, readingMinutes } from "../src/lib/text";
import { categories, flavorTags, pairings, products, usageTags } from "./seed-data/catalog";
import { blogCategories, posts } from "./seed-data/blog";
import { announcements, faqItems, pages } from "./seed-data/pages";

const db = new PrismaClient();

async function seedCategories() {
  for (const category of categories) {
    await db.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        slug: category.slug,
        name: category.name,
        shortName: category.shortName ?? null,
        description: category.description,
        menuGroup: category.menuGroup,
        imageUrl: category.imageUrl,
        imageAlt: category.imageAlt,
        accentColor: category.accentColor,
        sortOrder: category.sortOrder,
        seoTitle: category.seoTitle,
        seoDescription: category.seoDescription,
      },
    });
  }
  console.log(`✓ ${categories.length} kategori`);
}

async function seedTags() {
  let order = 0;
  for (const tag of flavorTags) {
    await db.tag.upsert({
      where: { type_slug: { type: "FLAVOR", slug: tag.slug } },
      update: {},
      create: { type: "FLAVOR", slug: tag.slug, name: tag.name, color: tag.color, description: tag.description, sortOrder: order++ },
    });
  }
  order = 0;
  for (const tag of usageTags) {
    await db.tag.upsert({
      where: { type_slug: { type: "USAGE", slug: tag.slug } },
      update: {},
      create: { type: "USAGE", slug: tag.slug, name: tag.name, sortOrder: order++ },
    });
  }
  console.log(`✓ ${flavorTags.length + usageTags.length} etiket`);
}

async function seedProducts() {
  const categoryBySlug = new Map((await db.category.findMany()).map((c) => [c.slug, c]));
  const tags = await db.tag.findMany();
  const tagId = (type: string, slug: string) => tags.find((t) => t.type === type && t.slug === slug)?.id;
  let created = 0;

  for (const product of products) {
    const exists = await db.product.findUnique({ where: { slug: product.slug }, select: { id: true } });
    if (exists) continue;
    const primary = categoryBySlug.get(product.primaryCategory);
    if (!primary) throw new Error(`Kategori bulunamadı: ${product.primaryCategory}`);
    const categorySlugs = Array.from(new Set([product.primaryCategory, ...(product.categories ?? [])]));
    const tagNames = [
      ...(product.flavors ?? []).map((slug) => flavorTags.find((t) => t.slug === slug)?.name ?? ""),
      ...(product.usages ?? []).map((slug) => usageTags.find((t) => t.slug === slug)?.name ?? ""),
    ];
    const searchText = normalizeForSearch(
      [
        product.name,
        product.subtitle,
        product.brand,
        product.variant.sku,
        product.variant.name,
        ...categorySlugs.map((slug) => categoryBySlug.get(slug)?.name),
        ...tagNames,
      ]
        .filter(Boolean)
        .join(" "),
    );
    const status = product.status ?? "ACTIVE";
    const fits = await Promise.all(
      product.images.map((image) => detectImageFit(path.join(process.cwd(), "public", image.url)).catch(() => "contain" as const)),
    );

    await db.product.create({
      data: {
        slug: product.slug,
        name: product.name,
        subtitle: product.subtitle ?? null,
        brand: product.brand ?? null,
        kind: product.kind ?? "SIMPLE",
        status,
        saleStatus: product.saleStatus ?? "AVAILABLE",
        primaryCategoryId: primary.id,
        shortDescription: product.shortDescription,
        description: product.description,
        usageAreasText: product.usageAreasText ?? null,
        usageTips: product.usageTips ?? null,
        kitContents: product.kitContents ?? null,
        kitPreparation: product.kitPreparation ?? null,
        accentColor: product.accentColor,
        isFeatured: product.isFeatured ?? false,
        freeShipping: product.freeShipping ?? false,
        sortOrder: product.sortOrder,
        seoDescription: product.seoDescription ?? null,
        searchText,
        publishedAt: status === "ACTIVE" ? new Date() : null,
        categories: {
          create: categorySlugs.map((slug, index) => ({ categoryId: categoryBySlug.get(slug)!.id, sortOrder: index })),
        },
        images: {
          create: product.images.map((image, index) => ({
            url: image.url,
            alt: image.alt,
            isPlaceholder: image.isPlaceholder ?? false,
            kind: image.kind ?? "PACKSHOT",
            fit: fits[index],
            sortOrder: index,
          })),
        },
        variants: {
          create: {
            sku: product.variant.sku,
            name: product.variant.name,
            packageType: product.variant.packageType,
            netWeightGrams: product.variant.netWeightGrams ?? null,
            unitsPerCase: product.variant.unitsPerCase ?? null,
            priceKurus: product.variant.priceKurus,
            vatRate: product.variant.vatRate,
            // Gerçek stok miktarları bilinmediğinden stok takibi kapalı başlar; panelden açılmalıdır.
            trackStock: false,
            stock: 0,
            isDefault: true,
          },
        },
        tags: {
          create: [
            ...(product.flavors ?? []).map((slug) => tagId("FLAVOR", slug)),
            ...(product.usages ?? []).map((slug) => tagId("USAGE", slug)),
          ]
            .filter((id): id is string => Boolean(id))
            .map((id) => ({ tagId: id })),
        },
      },
    });
    created++;
  }
  console.log(`✓ ${created} yeni ürün (toplam tanım: ${products.length})`);

  // Birlikte iyi gider eşleşmeleri
  const bySlug = new Map((await db.product.findMany({ select: { id: true, slug: true } })).map((p) => [p.slug, p.id]));
  let relations = 0;
  for (const [source, targets] of Object.entries(pairings)) {
    const sourceId = bySlug.get(source);
    if (!sourceId) continue;
    for (const [index, target] of targets.entries()) {
      const targetId = bySlug.get(target);
      if (!targetId) continue;
      await db.productRelation.upsert({
        where: { sourceId_targetId_type: { sourceId, targetId, type: "PAIRS_WITH" } },
        update: {},
        create: { sourceId, targetId, type: "PAIRS_WITH", sortOrder: index },
      });
      relations++;
    }
  }
  console.log(`✓ ${relations} "birlikte iyi gider" eşleşmesi`);
}

async function seedBlog() {
  for (const category of blogCategories) {
    await db.blogCategory.upsert({ where: { slug: category.slug }, update: {}, create: category });
  }
  const categoryBySlug = new Map((await db.blogCategory.findMany()).map((c) => [c.slug, c.id]));
  const productBySlug = new Map((await db.product.findMany({ select: { id: true, slug: true } })).map((p) => [p.slug, p.id]));
  let created = 0;
  for (const post of posts) {
    const exists = await db.blogPost.findUnique({ where: { slug: post.slug }, select: { id: true } });
    if (exists) continue;
    const tagIds: string[] = [];
    for (const name of post.tags) {
      const slug = normalizeForSearch(name).replace(/\s+/g, "-");
      const tag = await db.blogTag.upsert({ where: { slug }, update: {}, create: { slug, name } });
      tagIds.push(tag.id);
    }
    await db.blogPost.create({
      data: {
        slug: post.slug,
        type: post.type,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImageUrl: post.cover,
        coverImageAlt: post.coverAlt,
        coverCredit: post.coverCredit,
        authorName: "ByMaster Mutfak",
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - post.daysAgo * 24 * 60 * 60 * 1000),
        readingMinutes: readingMinutes(post.content),
        categoryId: categoryBySlug.get(post.category) ?? null,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        recipeIngredients: post.recipeIngredients ?? null,
        recipeSteps: post.recipeSteps ?? null,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
        products: {
          create: post.products
            .map((p, index) => ({ productId: productBySlug.get(p.slug), note: p.note ?? null, sortOrder: index }))
            .filter((p): p is { productId: string; note: string | null; sortOrder: number } => Boolean(p.productId)),
        },
      },
    });
    created++;
  }
  console.log(`✓ ${created} yeni blog yazısı`);
}

async function seedContent() {
  for (const page of pages) {
    await db.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        slug: page.slug,
        title: page.title,
        kind: page.kind,
        status: page.status,
        content: page.content,
        seoDescription: page.seoDescription ?? null,
        publishedAt: page.status === "PUBLISHED" ? new Date() : null,
      },
    });
  }
  console.log(`✓ ${pages.length} sayfa (yasal metinler taslak)`);

  if ((await db.faqItem.count()) === 0) {
    await db.faqItem.createMany({ data: faqItems.map((item, index) => ({ ...item, sortOrder: index * 10 })) });
    console.log(`✓ ${faqItems.length} SSS maddesi`);
  }
  if ((await db.announcement.count()) === 0) {
    await db.announcement.createMany({ data: announcements });
    console.log(`✓ ${announcements.length} duyuru`);
  }
  await db.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1, storeName: "ByMaster" } });
  console.log("✓ site ayarları");
}

async function main() {
  await seedCategories();
  await seedTags();
  await seedProducts();
  await seedBlog();
  await seedContent();
  const admins = await db.user.count({ where: { role: "ADMIN" } });
  if (admins === 0) {
    console.log("\nℹ Henüz yönetici hesabı yok. Oluşturmak için:\n  npm run admin:create -- --email siz@alanadiniz.com --name \"Ad Soyad\"\n");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
