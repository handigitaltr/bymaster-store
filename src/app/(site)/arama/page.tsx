import type { Metadata } from "next";
import { Search } from "lucide-react";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { CatalogView } from "@/components/catalog/CatalogView";
import { browseCatalog } from "@/lib/catalog";
import { parseCatalogParams } from "@/lib/catalog-params";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = {
  title: "Arama",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: Props) {
  const catalogParams = parseCatalogParams(await searchParams);
  const query = catalogParams.q.trim();
  const limited = query ? !(await rateLimit("search", await getClientIp())).ok : false;
  const result =
    query && !limited
      ? await browseCatalog({
          q: query,
          flavor: catalogParams.lezzet,
          usage: catalogParams.kullanim,
          packageType: catalogParams.ambalaj.map((value) => value.toUpperCase()),
          inStock: catalogParams.stok,
          sort: catalogParams.sirala,
          page: catalogParams.sayfa,
        })
      : null;

  return (
    <>
      <CatalogHeader
        eyebrow="Arama"
        title={query ? <>“{query}” için sonuçlar</> : "Ürün ara"}
        crumbs={[{ name: "Arama", path: "/arama" }]}
      >
        <form action="/arama" role="search" className="mt-6 flex max-w-xl items-center gap-2 rounded-full border border-cocoa-800/15 bg-white p-1.5 pl-5">
          <Search className="size-5 flex-none text-cocoa-400" aria-hidden="true" />
          <label htmlFor="search-page-input" className="sr-only">
            Ürün, kategori veya lezzet
          </label>
          <input
            id="search-page-input"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Ürün, kategori veya lezzet…"
            className="h-11 w-full bg-transparent text-base focus:outline-none"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Ara
          </button>
        </form>
      </CatalogHeader>
      {limited ? (
        <p className="container-page pb-20 text-cocoa-600">Çok fazla arama yaptınız. Lütfen biraz sonra tekrar deneyin.</p>
      ) : result ? (
        <CatalogView
          basePath="/arama"
          params={catalogParams}
          result={result}
          emptyMessage={`“${query}” için ürün bulunamadı.`}
        />
      ) : (
        <p className="container-page pb-20 text-cocoa-600">Aramak istediğiniz ürünü, kategoriyi veya lezzeti yazın.</p>
      )}
    </>
  );
}
