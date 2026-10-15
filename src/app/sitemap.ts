import type { MetadataRoute } from "next";
import { ACTIVE_PRODUCT } from "@/lib/catalog";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [products, categories, posts, blogCategories, pages] = await Promise.all([
    db.product.findMany({ where: ACTIVE_PRODUCT, select: { slug: true, updatedAt: true, images: { where: { isPlaceholder: false }, select: { url: true }, take: 3 } } }),
    db.category.findMany({ where: { isActive: true, products: { some: { product: ACTIVE_PRODUCT } } }, select: { slug: true, updatedAt: true } }),
    db.blogPost.findMany({ where: { status: "PUBLISHED", publishedAt: { lte: now } }, select: { slug: true, updatedAt: true, coverImageUrl: true } }),
    db.blogCategory.findMany({ where: { posts: { some: { status: "PUBLISHED", publishedAt: { lte: now } } } }, select: { slug: true, updatedAt: true } }),
    db.page.findMany({ where: { status: "PUBLISHED", slug: { not: "hakkimizda" } }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticPaths = ["/", "/urunler", "/lezzet-dunyasi", "/tarifler", "/profesyonel", "/profesyonel/teklif", "/hakkimizda", "/iletisim", "/sss", "/siparis-takip"];

  return [
    ...staticPaths.map((path) => ({ url: absoluteUrl(path), lastModified: now, changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.7 })),
    ...categories.map((category) => ({ url: absoluteUrl(`/kategori/${category.slug}`), lastModified: category.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((product) => ({
      url: absoluteUrl(`/urun/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: product.images.map((image) => absoluteUrl(image.url)),
    })),
    ...blogCategories.map((category) => ({ url: absoluteUrl(`/tarifler/kategori/${category.slug}`), lastModified: category.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/tarifler/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      ...(post.coverImageUrl ? { images: [absoluteUrl(post.coverImageUrl)] } : {}),
    })),
    ...pages.map((page) => ({ url: absoluteUrl(`/sayfa/${page.slug}`), lastModified: page.updatedAt, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
