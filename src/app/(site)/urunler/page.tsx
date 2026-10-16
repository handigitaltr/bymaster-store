import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { CatalogView } from "@/components/catalog/CatalogView";
import { browseCatalog, getActiveCategories } from "@/lib/catalog";
import { parseCatalogParams } from "@/lib/catalog-params";
import { pageMetadata } from "@/lib/seo";
import { STATIC_SITE } from "@/lib/site-mode";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = pageMetadata({
  title: "Tüm Ürünler",
  description:
    "ByMaster waffle sosları, Premium Çikolata Bazı, pirinç patlakları, krep kırıkları, şekerlemeler, waffle mix ve evde tatlı kitleri. Kategoriye, lezzete ve kullanım alanına göre keşfedin.",
  path: "/urunler",
});

export default async function ProductsPage({ searchParams }: Props) {
  // Statik vitrinde sayfa derleme anında üretilir; adres parametreleri (filtre, sıralama) okunamaz ve tüm ürünler listelenir
  const catalogParams = parseCatalogParams(STATIC_SITE ? {} : await searchParams);
  const [result, categories] = await Promise.all([
    browseCatalog({
      categorySlug: catalogParams.kategori || undefined,
      flavor: catalogParams.lezzet,
      usage: catalogParams.kullanim,
      packageType: catalogParams.ambalaj.map((value) => value.toUpperCase()),
      inStock: catalogParams.stok,
      sort: catalogParams.sirala,
      page: catalogParams.sayfa,
      pageSize: STATIC_SITE ? 500 : undefined,
    }),
    getActiveCategories(),
  ]);

  return (
    <>
      <CatalogHeader
        eyebrow="Katalog"
        title="Tüm Ürünler"
        description={
          STATIC_SITE
            ? "Soslardan süslemelere, karışımlardan evde tatlı kitlerine ByMaster kataloğu. Kategorilere göre göz atın."
            : "Soslardan süslemelere, karışımlardan evde tatlı kitlerine ByMaster kataloğu. Lezzet ailesine, kullanım alanına ve ambalaja göre daraltın."
        }
        crumbs={[{ name: "Ürünler", path: "/urunler" }]}
      >
        <Link href="/lezzet-dunyasi#lezzet-haritasi" className="group mt-6 inline-flex items-center gap-2 text-sm font-bold text-bordeaux-600">
          <span className="link-underline">Lezzet haritasıyla keşfedin</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </CatalogHeader>
      <CatalogView
        basePath="/urunler"
        params={catalogParams}
        result={result}
        categoryFacet={categories
          .filter((category) => category._count.products > 0)
          .map((category) => ({ value: category.slug, label: category.name, count: category._count.products }))}
      />
    </>
  );
}
