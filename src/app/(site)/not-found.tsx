import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-content-center py-24 text-center">
      <p className="font-display text-[7rem] leading-none text-cream-400">404</p>
      <h1 className="display-md -mt-4 text-cocoa-900">Aradığınız sayfa bulunamadı</h1>
      <p className="mx-auto mt-4 max-w-md text-cocoa-600">Sayfa taşınmış ya da kaldırılmış olabilir. Ürünlerimize veya tariflerimize göz atabilirsiniz.</p>
      <form action="/arama" role="search" className="mx-auto mt-8 flex w-full max-w-md items-center gap-2 rounded-full border border-cocoa-800/15 bg-white p-1.5 pl-5">
        <Search className="size-4 text-cocoa-400" aria-hidden="true" />
        <label htmlFor="nf-search" className="sr-only">
          Ürün ara
        </label>
        <input id="nf-search" name="q" type="search" placeholder="Ürün ara…" className="h-10 w-full bg-transparent focus:outline-none" />
        <button type="submit" className="btn btn-sm btn-primary">
          Ara
        </button>
      </form>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-outline">
          Ana sayfa
        </Link>
        <Link href="/urunler" className="btn btn-outline">
          Ürünler
        </Link>
        <Link href="/tarifler" className="btn btn-outline">
          Tarifler
        </Link>
      </div>
    </div>
  );
}
