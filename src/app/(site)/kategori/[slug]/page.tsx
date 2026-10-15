import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { CatalogView } from "@/components/catalog/CatalogView";
import { browseCatalog } from "@/lib/catalog";
import { parseCatalogParams } from "@/lib/catalog-params";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getCategory = cache(async (slug: string) =>
  db.category.findFirst({
    where: { slug, isActive: true },
    select: {
      slug: true,
      name: true,
      description: true,
      menuGroup: true,
      imageUrl: true,
      imageAlt: true,
      seoTitle: true,
      seoDescription: true,
    },
  }),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Kategori bulunamadı" };
  return pageMetadata({
    title: category.seoTitle ?? category.name,
    description: category.seoDescription ?? category.description ?? `${category.name} — ByMaster profesyonel pastacılık ürünleri.`,
    path: `/kategori/${category.slug}`,
    image: category.imageUrl,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const catalogParams = parseCatalogParams(await searchParams);
  const result = await browseCatalog({
    categorySlug: category.slug,
    flavor: catalogParams.lezzet,
    usage: catalogParams.kullanim,
    packageType: catalogParams.ambalaj.map((value) => value.toUpperCase()),
    inStock: catalogParams.stok,
    sort: catalogParams.sirala,
    page: catalogParams.sayfa,
  });

  return (
    <>
      <CatalogHeader
        eyebrow={category.menuGroup}
        title={category.name}
        description={category.description}
        crumbs={[
          { name: "Ürünler", path: "/urunler" },
          { name: category.name, path: `/kategori/${category.slug}` },
        ]}
        imageUrl={category.imageUrl}
        imageAlt={category.imageAlt}
      />
      <CatalogView basePath={`/kategori/${category.slug}`} params={catalogParams} result={result} />
    </>
  );
}
