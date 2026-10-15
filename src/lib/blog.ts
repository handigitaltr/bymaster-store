import "server-only";
import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { db } from "@/lib/db";

export const PUBLISHED_POST = (): Prisma.BlogPostWhereInput => ({ status: "PUBLISHED", publishedAt: { lte: new Date() } });

export const postListSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  type: true,
  coverImageUrl: true,
  coverImageAlt: true,
  readingMinutes: true,
  publishedAt: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.BlogPostSelect;

export async function listPosts(options: { categorySlug?: string; take?: number; skip?: number } = {}) {
  const where: Prisma.BlogPostWhereInput = {
    ...PUBLISHED_POST(),
    ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
  };
  const [posts, total] = await Promise.all([
    db.blogPost.findMany({ where, select: postListSelect, orderBy: { publishedAt: "desc" }, take: options.take ?? 12, skip: options.skip ?? 0 }),
    db.blogPost.count({ where }),
  ]);
  return { posts, total };
}

export const getBlogCategories = cache(async () =>
  db.blogCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, description: true, seoTitle: true, seoDescription: true, _count: { select: { posts: { where: PUBLISHED_POST() } } } },
  }),
);

export const getPost = cache(async (slug: string) =>
  db.blogPost.findFirst({
    where: { slug, ...PUBLISHED_POST() },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: true } },
      products: { orderBy: { sortOrder: "asc" }, include: { product: { select: { slug: true, status: true } } } },
    },
  }),
);

export async function getRelatedPosts(postId: string, categoryId: string | null, take = 3) {
  const sameCategory = categoryId
    ? await db.blogPost.findMany({
        where: { ...PUBLISHED_POST(), id: { not: postId }, categoryId },
        select: postListSelect,
        orderBy: { publishedAt: "desc" },
        take,
      })
    : [];
  if (sameCategory.length >= take) return sameCategory;
  const others = await db.blogPost.findMany({
    where: { ...PUBLISHED_POST(), id: { notIn: [postId, ...sameCategory.map((post) => post.id)] } },
    select: postListSelect,
    orderBy: { publishedAt: "desc" },
    take: take - sameCategory.length,
  });
  return [...sameCategory, ...others];
}

/** İçerikteki [[urun:slug]] satırlarını ayırır */
export type ContentBlock = { type: "markdown"; content: string } | { type: "product"; slug: string };

export function splitContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let buffer: string[] = [];
  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) blocks.push({ type: "markdown", content: text });
    buffer = [];
  };
  for (const line of content.split(/\r?\n/)) {
    const match = line.trim().match(/^\[\[urun:([a-z0-9-]{1,96})\]\]$/);
    if (match) {
      flush();
      blocks.push({ type: "product", slug: match[1] });
    } else {
      buffer.push(line);
    }
  }
  flush();
  return blocks;
}
