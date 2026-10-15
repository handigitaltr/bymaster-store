"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { formatTRY } from "@/lib/money";

type Result = {
  slug: string;
  name: string;
  subtitle: string | null;
  categoryName: string;
  imageUrl: string | null;
  priceKurus: number | null;
  comingSoon: boolean;
};

const SUGGESTIONS = ["Antep fıstıklı", "Lotus", "Krep kırığı", "Pirinç patlağı", "Waffle mix", "Churros"];

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  // Sonuçlar ait oldukları arama terimiyle birlikte tutulur; eski terimin sonuçları yeni terimde gösterilmez
  const [found, setFound] = useState<{ term: string; results: Result[] }>({ term: "", results: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const term = query.trim();
  const results = found.term === term ? found.results : [];

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/arama?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (response.ok) setFound({ term, results: ((await response.json()) as { results: Result[] }).results });
      } catch {
        // iptal edilen istekler yok sayılır
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [term]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!term) return;
    onClose();
    router.push(`/arama?q=${encodeURIComponent(term)}`);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Ürün ara" hideTitle className="!mt-[8vh] !mb-auto">
      <form onSubmit={submit} role="search" className="border-b border-cocoa-800/10 p-4 pr-14">
        <label htmlFor="site-search" className="sr-only">
          Ürün, kategori veya lezzet arayın
        </label>
        <div className="flex items-center gap-3">
          {loading ? (
            <LoaderCircle className="size-5 flex-none animate-spin text-cocoa-400" aria-hidden="true" />
          ) : (
            <Search className="size-5 flex-none text-cocoa-400" aria-hidden="true" />
          )}
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ürün, kategori veya lezzet arayın…"
            autoComplete="off"
            className="h-12 w-full bg-transparent text-lg text-cocoa-900 placeholder:text-cocoa-400 focus:outline-none"
          />
        </div>
      </form>
      <div className="p-4">
        {query.trim().length < 2 ? (
          <div>
            <p className="eyebrow mb-3">Sık aranan</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setQuery(suggestion)}
                  className="rounded-full border border-cocoa-800/15 px-3.5 py-1.5 text-sm font-semibold text-cocoa-700 hover:border-cocoa-800 hover:text-cocoa-900"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : found.term === term && results.length === 0 && !loading ? (
          <p className="py-6 text-center text-sm text-cocoa-500">“{query.trim()}” için sonuç bulunamadı.</p>
        ) : (
          <ul className="divide-y divide-cocoa-800/10" aria-live="polite">
            {results.map((result) => (
              <li key={result.slug}>
                <Link href={`/urun/${result.slug}`} onClick={onClose} className="flex items-center gap-3 rounded-lg py-2.5 hover:bg-cream-200/60">
                  <span className="relative size-14 flex-none overflow-hidden rounded-lg bg-cream-200">
                    {result.imageUrl ? (
                      <Image src={result.imageUrl} alt="" fill sizes="56px" className="object-contain p-1 mix-blend-multiply" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-cocoa-900">{result.name}</span>
                    <span className="block truncate text-xs text-cocoa-500">
                      {result.categoryName}
                      {result.subtitle ? ` · ${result.subtitle}` : ""}
                    </span>
                  </span>
                  <span className="text-sm font-bold tabular-nums text-cocoa-800">
                    {result.comingSoon ? "Yakında" : result.priceKurus !== null ? formatTRY(result.priceKurus) : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {query.trim().length >= 2 ? (
          <button type="button" onClick={submit} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-bordeaux-600">
            Tüm sonuçları gör <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </Dialog>
  );
}
