"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, LoaderCircle, ShoppingBag } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { addManyToCartAction } from "@/app/actions/cart";
import { useCart } from "@/components/cart/CartProvider";
import { productTint } from "@/components/product/ProductCard";
import type { ProductCardData } from "@/lib/catalog";
import { formatTRY } from "@/lib/money";
import { STATIC_SITE } from "@/lib/site-mode";
import { cx } from "@/lib/utils";
import { DessertIllustration, type DessertKind } from "./DessertIllustration";

const DESSERTS: Array<{ kind: DessertKind; label: string; usage: string; hint: string }> = [
  { kind: "waffle", label: "Waffle", usage: "waffle", hint: "Sıcak waffle, sosu en iyi taşıyan zemindir." },
  { kind: "pankek", label: "Pankek", usage: "pankek", hint: "Katlar arasında ince bir sos, üstte çıtır süsleme." },
  { kind: "krep", label: "Krep", usage: "krep", hint: "İnce çizgi hâlinde sos, kontrast bir süsleme." },
  { kind: "churros", label: "Churros", usage: "churros", hint: "Sos yanında dip olarak; paylaşmalık sunum." },
  { kind: "dondurma", label: "Dondurma", usage: "dondurma", hint: "Soğuk zeminde sos ve çıtır doku dengesi." },
];

const SAUCE_CATEGORIES = ["waffle-soslari", "cikolata-soslari", "meyveli-soslar"];

function toppingStyle(product: ProductCardData) {
  if (product.categorySlug === "krep-kiriklari") return "flake";
  if (product.categorySlug === "sekerlemeler-ve-toppingler") return "candy";
  return "bead";
}

function isBuyable(product: ProductCardData) {
  return Boolean(product.variant) && (product.availability === "IN_STOCK" || product.availability === "LOW_STOCK");
}

export function PresentationLab({ products }: { products: ProductCardData[] }) {
  const { setCartCount } = useCart();
  const [dessert, setDessert] = useState<DessertKind>("waffle");
  const [sauceId, setSauceId] = useState<string | null>(null);
  const [toppingIds, setToppingIds] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const current = DESSERTS.find((d) => d.kind === dessert)!;
  const sauces = useMemo(
    () => products.filter((p) => SAUCE_CATEGORIES.includes(p.categorySlug) && p.usages.some((u) => u.slug === current.usage) && p.variant),
    [products, current.usage],
  );
  const toppings = useMemo(
    () =>
      products.filter(
        (p) => ["pirinc-patlaklari", "krep-kiriklari", "sekerlemeler-ve-toppingler"].includes(p.categorySlug) && p.usages.some((u) => u.slug === current.usage) && p.variant,
      ),
    [products, current.usage],
  );

  const sauce = sauces.find((p) => p.id === sauceId) ?? null;
  const selectedToppings = toppingIds.map((id) => toppings.find((p) => p.id === id)).filter((p): p is ProductCardData => Boolean(p));
  const selection = [sauce, ...selectedToppings].filter((p): p is ProductCardData => Boolean(p));
  const total = selection.filter(isBuyable).reduce((sum, p) => sum + (p.variant?.priceKurus ?? 0), 0);

  const chooseDessert = (kind: DessertKind) => {
    setDessert(kind);
    setMessage(null);
    const usage = DESSERTS.find((d) => d.kind === kind)!.usage;
    if (sauce && !sauce.usages.some((u) => u.slug === usage)) setSauceId(null);
    setToppingIds((ids) => ids.filter((id) => toppings.find((t) => t.id === id)?.usages.some((u) => u.slug === usage)));
  };

  const toggleTopping = (id: string) =>
    setToppingIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= 2 ? [ids[1], id] : [...ids, id]));

  const option = (product: ProductCardData, selected: boolean, onClick: () => void, kind: "radio" | "checkbox") => (
    <li key={product.id}>
      <button
        type="button"
        role={kind}
        aria-checked={selected}
        onClick={onClick}
        className={cx(
          "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition",
          selected ? "border-cocoa-800 bg-cream-50 ring-1 ring-cocoa-800" : "border-cocoa-800/10 bg-cream-50/60 hover:border-cocoa-800/35",
        )}
      >
        <span className="relative size-11 flex-none overflow-hidden rounded-lg" style={{ background: productTint(product.accentColor, 18) }}>
          {product.image ? (
            <Image src={product.image.url} alt="" fill sizes="44px" className={product.image.fit === "cover" ? "object-cover" : "object-contain p-1 mix-blend-multiply"} />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-cocoa-900">{product.name.replace(/^ByMaster\s+/, "")}</span>
          <span className="block text-xs text-cocoa-500">
            {product.subtitle} · {product.variant && product.availability !== "COMING_SOON" ? formatTRY(product.variant.priceKurus) : "Yakında"}
          </span>
        </span>
        <span
          className={cx(
            "grid size-5 flex-none place-content-center border",
            kind === "radio" ? "rounded-full" : "rounded-md",
            selected ? "border-cocoa-800 bg-cocoa-800 text-cream-50" : "border-cocoa-300",
          )}
          aria-hidden="true"
        >
          {selected ? <Check className="size-3" strokeWidth={3} /> : null}
        </span>
      </button>
    </li>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div role="radiogroup" aria-label="Tatlı türü" className="flex flex-wrap gap-2">
          {DESSERTS.map((d) => (
            <button
              key={d.kind}
              type="button"
              role="radio"
              aria-checked={dessert === d.kind}
              onClick={() => chooseDessert(d.kind)}
              className={cx(
                "rounded-full px-4 py-2 text-sm font-bold transition",
                dessert === d.kind ? "bg-cocoa-800 text-cream-50" : "border border-cocoa-800/15 bg-cream-50 text-cocoa-700 hover:border-cocoa-800/40",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="relative mt-8 rounded-[1.6rem] bg-cream-300/60 p-6">
          <DessertIllustration
            kind={dessert}
            sauceColor={sauce?.accentColor ?? null}
            toppingColors={selectedToppings.map((t) => t.accentColor ?? "#BC8855")}
            toppingStyles={selectedToppings.map(toppingStyle)}
          />
          <p className="mt-2 text-center text-xs text-cocoa-500">Temsili illüstrasyon · {current.hint}</p>
        </div>
        <div className="mt-6 rounded-[1.4rem] bg-cocoa-900 p-6 text-cream-100" aria-live="polite">
          <p className="eyebrow eyebrow-light">Kombinasyonunuz</p>
          <p className="mt-2 font-display text-2xl text-cream-50">
            {current.label}
            {sauce ? ` + ${sauce.name.replace(/^ByMaster\s+/, "")}` : ""}
            {selectedToppings.map((t) => ` + ${t.name.replace(/^ByMaster\s+/, "")}`).join("")}
          </p>
          {selection.length === 0 ? (
            <p className="mt-2 text-sm text-cream-300">Bir sos ve en fazla iki süsleme seçin.</p>
          ) : (
            <>
              <p className="mt-3 text-sm text-cream-300">
                Seçilen ürünlerin ambalaj fiyatları toplamı: <strong className="tabular-nums text-cream-50">{formatTRY(total)}</strong>
              </p>
              {STATIC_SITE ? null : (
                <button
                  type="button"
                  className="btn btn-light mt-4"
                  disabled={pending || selection.filter(isBuyable).length === 0}
                  onClick={() =>
                    start(async () => {
                      const ids = selection.filter(isBuyable).map((p) => p.variant!.id);
                      const result = await addManyToCartAction(ids);
                      setCartCount(result.count);
                      setMessage(result.added > 0 ? `${result.added} ürün sepetinize eklendi.` : result.messages.join(" "));
                    })
                  }
                >
                  {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ShoppingBag className="size-4" aria-hidden="true" />}
                  Seçimleri sepete ekle
                </button>
              )}
              {message ? (
                <p className="mt-3 text-sm font-semibold text-caramel-300">
                  {message}{" "}
                  <Link href="/sepet" className="underline">
                    Sepete git
                  </Link>
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7">
        <div>
          <p className="eyebrow mb-3">1 · Sos seçin</p>
          <ul role="radiogroup" aria-label="Sos" className="space-y-2">
            {sauces.map((product) => option(product, sauceId === product.id, () => setSauceId(sauceId === product.id ? null : product.id), "radio"))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-3">2 · Süsleme seçin (en fazla 2)</p>
          <ul aria-label="Süslemeler" className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
            {toppings.map((product) => option(product, toppingIds.includes(product.id), () => toggleTopping(product.id), "checkbox"))}
          </ul>
        </div>
      </div>
    </div>
  );
}
