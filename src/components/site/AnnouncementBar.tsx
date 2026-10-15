"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export type AnnouncementItem = { id: string; message: string; linkUrl: string | null; linkLabel: string | null };

export function AnnouncementBar({ items }: { items: AnnouncementItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(timer);
  }, [items.length, paused]);

  if (items.length === 0) return null;
  const item = items[index] ?? items[0];

  return (
    <div
      className="bg-cocoa-900 text-cream-100"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="container-page flex min-h-9 items-center justify-center gap-3 py-1.5 text-center text-[0.78rem] font-semibold tracking-wide">
        <p key={item.id} className="animate-fade-in" aria-live="polite">
          {item.message}
          {item.linkUrl ? (
            <Link href={item.linkUrl} className="group ml-2 inline-flex items-center gap-1 text-caramel-300 hover:text-caramel-200">
              <span className="link-underline">{item.linkLabel ?? "İncele"}</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ) : null}
        </p>
        {items.length > 1 ? (
          <span className="hidden items-center gap-1.5 sm:flex" aria-hidden="true">
            {items.map((entry, i) => (
              <span key={entry.id} className={`size-1.5 rounded-full ${i === index ? "bg-caramel-300" : "bg-cream-50/25"}`} />
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
