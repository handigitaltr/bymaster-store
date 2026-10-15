"use client";

import Link from "next/link";
import { useEffect } from "react";

// Hata ayrıntıları kullanıcıya gösterilmez; yalnızca kısa bir referans (digest) paylaşılır.
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error.digest ?? "hata");
  }, [error]);
  return (
    <div className="container-page grid min-h-[60vh] place-content-center py-24 text-center">
      <h1 className="display-md text-cocoa-900">Bir şeyler ters gitti</h1>
      <p className="mx-auto mt-4 max-w-md text-cocoa-600">İşleminiz tamamlanamadı. Lütfen tekrar deneyin; sorun devam ederse bize ulaşın.</p>
      {error.digest ? <p className="mt-2 text-xs text-cocoa-400">Referans: {error.digest}</p> : null}
      <div className="mt-8 flex justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Tekrar dene
        </button>
        <Link href="/" className="btn btn-outline">
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}
