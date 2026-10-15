"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";
import type { ProductCardData } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

export function ProductRail({ products, label }: { products: ProductCardData[]; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const scroll = (direction: 1 | -1) => {
    const list = ref.current;
    if (!list) return;
    const item = list.querySelector("li");
    const step = item ? item.getBoundingClientRect().width + 20 : list.clientWidth * 0.8;
    list.scrollBy({ left: direction * step * 2, behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div className="mb-5 hidden justify-end gap-2 md:flex">
        <button type="button" onClick={() => scroll(-1)} className="grid size-11 place-content-center rounded-full border border-cocoa-800/20 text-cocoa-800 hover:bg-cocoa-800 hover:text-cream-50" aria-label="Önceki ürünler">
          <ArrowLeft className="size-4" />
        </button>
        <button type="button" onClick={() => scroll(1)} className="grid size-11 place-content-center rounded-full border border-cocoa-800/20 text-cocoa-800 hover:bg-cocoa-800 hover:text-cream-50" aria-label="Sonraki ürünler">
          <ArrowRight className="size-4" />
        </button>
      </div>
      <ul
        ref={ref}
        aria-label={label}
        className="scrollbar-none relative -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10"
      >
        {products.map((product, index) => (
          <li key={product.id} className="w-[72%] flex-none snap-start sm:w-[44%] md:w-[31%] lg:w-[23%]">
            <ProductCard product={product} priority={index < 2} sizes="(min-width: 1024px) 23vw, (min-width: 640px) 44vw, 72vw" />
          </li>
        ))}
      </ul>
    </div>
  );
}
