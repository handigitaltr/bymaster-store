import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

// Eşleşmeyen tüm adresler için (site düzeninin dışında kalan yollar dahil)
export default function RootNotFound() {
  return (
    <div className="grid min-h-dvh place-content-center bg-cream-200 px-4 text-center">
      <Link href="/" className="mx-auto text-cocoa-800" aria-label="ByMaster ana sayfa">
        <Logo className="w-44" />
      </Link>
      <p className="mt-10 font-display text-[6rem] leading-none text-cream-500">404</p>
      <h1 className="display-md -mt-2 text-cocoa-900">Aradığınız sayfa bulunamadı</h1>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Ana sayfa
        </Link>
        <Link href="/urunler" className="btn btn-outline">
          Ürünler
        </Link>
      </div>
    </div>
  );
}
