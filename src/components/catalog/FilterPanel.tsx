import Link from "next/link";
import { Check } from "lucide-react";
import type { CatalogPage, Facet } from "@/lib/catalog";
import { catalogHref, toggleValue, type CatalogParams } from "@/lib/catalog-params";
import { cx } from "@/lib/utils";

function FilterLink({
  href,
  active,
  label,
  count,
  color,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  color?: string | null;
}) {
  const disabled = count === 0 && !active;
  return (
    <li>
      <Link
        href={href}
        rel="nofollow"
        scroll={false}
        aria-current={active ? "true" : undefined}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        className={cx(
          "group flex items-center gap-3 rounded-lg py-1.5 text-[0.92rem] transition-colors",
          disabled ? "pointer-events-none text-cocoa-300" : active ? "font-bold text-cocoa-900" : "text-cocoa-700 hover:text-cocoa-950",
        )}
      >
        <span
          className={cx(
            "grid size-[1.15rem] flex-none place-content-center rounded-[0.3rem] border transition-colors",
            active ? "border-cocoa-800 bg-cocoa-800 text-cream-50" : "border-cocoa-400 bg-white group-hover:border-cocoa-700",
          )}
          aria-hidden="true"
        >
          {active ? <Check className="size-3" strokeWidth={3} /> : null}
        </span>
        {color ? <span className="size-3 flex-none rounded-full ring-1 ring-black/10" style={{ background: color }} aria-hidden="true" /> : null}
        <span className="flex-1">{label}</span>
        <span className="text-xs tabular-nums text-cocoa-400">{count}</span>
      </Link>
    </li>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-cocoa-800/10 py-5 first:border-t-0 first:pt-0">
      <p className="eyebrow mb-3">{title}</p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

export function FilterPanel({
  basePath,
  params,
  facets,
  categoryFacet,
}: {
  basePath: string;
  params: CatalogParams;
  facets: CatalogPage["facets"];
  categoryFacet?: Facet[];
}) {
  return (
    <div>
      {categoryFacet && categoryFacet.length > 0 ? (
        <Group title="Kategori">
          {categoryFacet.map((facet) => (
            <FilterLink
              key={facet.value}
              href={catalogHref(basePath, params, { kategori: params.kategori === facet.value ? "" : facet.value })}
              active={params.kategori === facet.value}
              label={facet.label}
              count={facet.count}
            />
          ))}
        </Group>
      ) : null}
      {facets.flavors.length > 0 ? (
        <Group title="Lezzet ailesi">
          {facets.flavors.map((facet) => (
            <FilterLink
              key={facet.value}
              href={catalogHref(basePath, params, { lezzet: toggleValue(params.lezzet, facet.value) })}
              active={params.lezzet.includes(facet.value)}
              label={facet.label}
              count={facet.count}
              color={facet.color}
            />
          ))}
        </Group>
      ) : null}
      {facets.usages.length > 0 ? (
        <Group title="Kullanım alanı">
          {facets.usages.map((facet) => (
            <FilterLink
              key={facet.value}
              href={catalogHref(basePath, params, { kullanim: toggleValue(params.kullanim, facet.value) })}
              active={params.kullanim.includes(facet.value)}
              label={facet.label}
              count={facet.count}
            />
          ))}
        </Group>
      ) : null}
      {facets.packageTypes.length > 1 ? (
        <Group title="Ambalaj">
          {facets.packageTypes.map((facet) => {
            const value = facet.value.toLowerCase();
            return (
              <FilterLink
                key={facet.value}
                href={catalogHref(basePath, params, { ambalaj: toggleValue(params.ambalaj, value) })}
                active={params.ambalaj.includes(value)}
                label={facet.label}
                count={facet.count}
              />
            );
          })}
        </Group>
      ) : null}
      <Group title="Stok durumu">
        <FilterLink
          href={catalogHref(basePath, params, { stok: !params.stok })}
          active={params.stok}
          label="Yalnızca stoktakiler"
          count={facets.inStockCount}
        />
      </Group>
    </div>
  );
}
