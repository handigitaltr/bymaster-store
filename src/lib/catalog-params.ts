// Katalog URL parametreleri (Türkçe, paylaşılabilir ve JavaScript olmadan çalışan filtre bağlantıları)

export type CatalogParams = {
  lezzet: string[];
  kullanim: string[];
  ambalaj: string[];
  stok: boolean;
  sirala: string;
  sayfa: number;
  q: string;
  kategori: string;
};

type RawParams = Record<string, string | string[] | undefined>;

const SLUG = /^[a-z0-9-]{1,40}$/;
const SORTS = ["onerilen", "fiyat-artan", "fiyat-azalan", "a-z", "z-a", "yeni"];
const PACKAGES = ["kova", "paket", "kutu", "sise", "koli"];

function list(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  return Array.from(new Set(raw.split(",").map((part) => part.trim().toLowerCase()).filter((part) => SLUG.test(part)))).slice(0, 10);
}

function single(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseCatalogParams(raw: RawParams): CatalogParams {
  const sort = single(raw.sirala);
  const page = Number.parseInt(single(raw.sayfa), 10);
  const category = single(raw.kategori).toLowerCase();
  return {
    lezzet: list(raw.lezzet),
    kullanim: list(raw.kullanim),
    ambalaj: list(raw.ambalaj).filter((value) => PACKAGES.includes(value)),
    stok: single(raw.stok) === "var",
    sirala: SORTS.includes(sort) ? sort : "onerilen",
    sayfa: Number.isFinite(page) && page > 0 ? Math.min(page, 20) : 1,
    q: single(raw.q).slice(0, 80),
    kategori: SLUG.test(category) ? category : "",
  };
}

export function hasActiveFilters(params: CatalogParams): boolean {
  return params.lezzet.length > 0 || params.kullanim.length > 0 || params.ambalaj.length > 0 || params.stok;
}

export function catalogHref(basePath: string, params: CatalogParams, change: Partial<CatalogParams> = {}): string {
  const next: CatalogParams = { ...params, sayfa: 1, ...change };
  const search = new URLSearchParams();
  if (next.q) search.set("q", next.q);
  if (next.kategori) search.set("kategori", next.kategori);
  if (next.lezzet.length) search.set("lezzet", next.lezzet.join(","));
  if (next.kullanim.length) search.set("kullanim", next.kullanim.join(","));
  if (next.ambalaj.length) search.set("ambalaj", next.ambalaj.join(","));
  if (next.stok) search.set("stok", "var");
  if (next.sirala && next.sirala !== "onerilen") search.set("sirala", next.sirala);
  if (next.sayfa > 1) search.set("sayfa", String(next.sayfa));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
