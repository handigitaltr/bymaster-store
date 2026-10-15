"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { cx } from "@/lib/utils";

export type GalleryImage = { url: string; alt: string; isPlaceholder: boolean; fit: string };

export function ProductGallery({ images, name, tint }: { images: GalleryImage[]; name: string; tint: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const current = images[index] ?? images[0];
  if (!current) {
    return <div className="aspect-square rounded-[1.6rem]" style={{ background: tint }} />;
  }
  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {images.length > 1 ? (
        <ul className="scrollbar-none relative flex gap-3 overflow-x-auto md:w-20 md:flex-col" aria-label="Ürün görselleri">
          {images.map((image, i) => (
            <li key={image.url + i} className="flex-none">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}. görsel`}
                aria-current={i === index}
                className={cx(
                  "relative block size-20 overflow-hidden rounded-xl ring-2 transition",
                  i === index ? "ring-cocoa-800" : "ring-transparent hover:ring-cocoa-300",
                )}
                style={{ background: tint }}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
                  className={image.fit === "cover" ? "object-cover" : "object-contain p-1.5 mix-blend-multiply"}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setZoom(true)}
          className="group relative block aspect-square w-full overflow-hidden rounded-[1.6rem]"
          style={{ background: tint }}
          aria-label={`${name} görselini büyüt`}
        >
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt}
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className={cx(
              "animate-fade-in transition-transform duration-700 group-hover:scale-[1.03]",
              current.fit === "cover" ? "object-cover" : "object-contain p-[8%] mix-blend-multiply",
            )}
          />
          <span className="absolute right-4 top-4 grid size-10 place-content-center rounded-full bg-cream-50/90 text-cocoa-800 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            <Expand className="size-4" aria-hidden="true" />
          </span>
        </button>
        {current.isPlaceholder ? (
          <p className="absolute bottom-4 left-4 max-w-[80%] rounded-xl bg-cream-50/95 px-3 py-2 text-xs font-semibold text-cocoa-700">
            Temsili görsel — ürün fotoğrafı henüz eklenmedi. Gerçek ambalaj farklılık gösterebilir.
          </p>
        ) : null}
        {images.length > 1 ? (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button type="button" onClick={() => go(-1)} className="grid size-10 place-content-center rounded-full bg-cream-50/90 text-cocoa-800 hover:bg-cream-50" aria-label="Önceki görsel">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" onClick={() => go(1)} className="grid size-10 place-content-center rounded-full bg-cream-50/90 text-cocoa-800 hover:bg-cream-50" aria-label="Sonraki görsel">
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      <Dialog open={zoom} onClose={() => setZoom(false)} title={name} className="!w-[min(64rem,calc(100vw-1.5rem))] !max-h-[92dvh]">
        <div className="relative aspect-square max-h-[78dvh] w-full bg-white">
          <Image src={current.url} alt={current.alt} fill sizes="90vw" className="object-contain" />
          {images.length > 1 ? (
            <>
              <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-content-center rounded-full bg-cocoa-900/80 text-cream-50" aria-label="Önceki görsel">
                <ChevronLeft className="size-5" />
              </button>
              <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-content-center rounded-full bg-cocoa-900/80 text-cream-50" aria-label="Sonraki görsel">
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}
        </div>
        <p className="px-5 py-3 text-sm text-cocoa-600">{current.alt}</p>
      </Dialog>
    </div>
  );
}
