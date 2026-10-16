import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Markdown } from "@/components/content/Markdown";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { ORDER_PLACEHOLDER_VARS, renderTemplate, sellerVars, shippingVars } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { STATIC_SITE } from "@/lib/site-mode";
import { formatDate, stripMarkdown, truncate } from "@/lib/text";

export const revalidate = 300;

export async function generateStaticParams() {
  // Tam sitede sayfalar ilk istekte üretilir (ISR); statik vitrinde (GitHub Pages) hepsi derleme anında üretilir
  if (!STATIC_SITE) return [];
  const pages = await db.page.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } });
  return pages.map((page) => ({ slug: page.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const getPage = cache(async (slug: string) => db.page.findFirst({ where: { slug, status: "PUBLISHED" } }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Sayfa bulunamadı" };
  return pageMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? truncate(stripMarkdown(page.content), 158),
    path: `/sayfa/${page.slug}`,
  });
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  const settings = await getSettings();
  const content = renderTemplate(page.content, { ...ORDER_PLACEHOLDER_VARS, ...sellerVars(settings, appUrl), ...shippingVars(settings) });

  return (
    <div className="container-page max-w-3xl pb-24 pt-8">
      <Breadcrumbs items={[{ name: page.title, path: `/sayfa/${page.slug}` }]} />
      <h1 className="display-lg mt-8 text-cocoa-900">{page.title}</h1>
      <p className="mt-3 text-sm text-cocoa-500">Son güncelleme: {formatDate(page.updatedAt)}</p>
      <div className="mt-10">
        <Markdown content={content} />
      </div>
    </div>
  );
}
