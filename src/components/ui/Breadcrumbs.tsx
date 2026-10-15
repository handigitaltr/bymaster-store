import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbJsonLd } from "@/lib/seo";
import { cx } from "@/lib/utils";
import { JsonLd } from "./JsonLd";

export type Crumb = { name: string; path: string };

export function Breadcrumbs({ items, className, tone = "light" }: { items: Crumb[]; className?: string; tone?: "light" | "dark" }) {
  const all = [{ name: "Ana sayfa", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(all)} />
      <nav aria-label="Sayfa konumu" className={cx("text-xs font-semibold", className)}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((item, index) => {
            const last = index === all.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1.5">
                {index > 0 ? (
                  <ChevronRight className={cx("size-3.5", tone === "dark" ? "text-cream-300/60" : "text-cocoa-300")} aria-hidden="true" />
                ) : null}
                {last ? (
                  <span aria-current="page" className={tone === "dark" ? "text-cream-100" : "text-cocoa-800"}>
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.path} className={cx("hover:underline", tone === "dark" ? "text-cream-300" : "text-cocoa-500")}>
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
