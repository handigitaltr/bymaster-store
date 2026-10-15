import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryTabs, PostGrid } from "@/components/blog/PostList";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getBlogCategories, listPosts } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getBlogCategories()).find((c) => c.slug === slug);
  if (!category) return { title: "Kategori bulunamadı" };
  return pageMetadata({
    title: category.seoTitle ?? `${category.name} — Lezzet Günlüğü`,
    description: category.seoDescription ?? category.description ?? `${category.name} yazıları — ByMaster Lezzet Günlüğü.`,
    path: `/tarifler/kategori/${category.slug}`,
  });
}

export default async function JournalCategoryPage({ params }: Props) {
  const { slug } = await params;
  const categories = await getBlogCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const { posts } = await listPosts({ categorySlug: slug, take: 30 });
  return (
    <div className="pb-24">
      <section className="bg-cream-200">
        <div className="container-page py-12 lg:py-16">
          <Breadcrumbs
            items={[
              { name: "Tarifler ve İlham", path: "/tarifler" },
              { name: category.name, path: `/tarifler/kategori/${category.slug}` },
            ]}
          />
          <h1 className="display-lg mt-8 text-cocoa-900">{category.name}</h1>
          {category.description ? <p className="mt-4 max-w-2xl text-lg text-cocoa-600">{category.description}</p> : null}
          <div className="mt-8">
            <CategoryTabs categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c._count.posts }))} active={category.slug} />
          </div>
        </div>
      </section>
      <div className="container-page mt-14">
        {posts.length ? <PostGrid posts={posts} /> : <p className="text-cocoa-600">Bu kategoride henüz yazı yok.</p>}
      </div>
    </div>
  );
}
