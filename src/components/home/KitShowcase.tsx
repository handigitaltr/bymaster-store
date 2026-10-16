"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LoaderCircle, Truck } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { addToCartAction } from "@/app/actions/cart";
import { useCart } from "@/components/cart/CartProvider";
import { formatTRY } from "@/lib/money";
import { STATIC_SITE } from "@/lib/site-mode";
import { cx } from "@/lib/utils";

export type KitItem = {
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string;
  contents: string[];
  preparation: string[];
  allergens: string | null;
  servingInfo: string | null;
  priceKurus: number | null;
  variantId: string | null;
  available: boolean;
  comingSoon: boolean;
  freeShipping: boolean;
};

function BuyNow({ kit }: { kit: KitItem }) {
  const router = useRouter();
  const { setCartCount } = useCart();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (STATIC_SITE || !kit.variantId || !kit.available) return null;
  return (
    <div>
      <button
        type="button"
        className="btn btn-lg btn-accent"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await addToCartAction({ variantId: kit.variantId!, quantity: 1 });
            if (!result.ok) {
              setError(result.message);
              return;
            }
            setCartCount(result.count);
            router.push("/sepet");
          })
        }
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        Hemen Satın Al
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function KitShowcase({ kits }: { kits: KitItem[] }) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  if (kits.length === 0) return null;
  const kit = kits[active] ?? kits[0];

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % kits.length);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + kits.length) % kits.length);
    }
  };

  return (
    <section className="bg-[#efe2cf] py-20 lg:py-28" aria-labelledby="kit-baslik">
      <div className="container-page">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-4">Evde tatlı deneyimi</p>
            <h2 id="kit-baslik" className="display-lg text-cocoa-900">
              Profesyonel Lezzetler, Kendi Mutfağınızda.
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-cocoa-600 lg:col-span-4 lg:col-start-9">
            Temel malzemeler tek kutuda. Kutunun içinde ne olduğunu, nasıl hazırlanacağını görün; dilediğinizi sepetinize ekleyin.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div role="tablist" aria-label="Tatlı kitleri" aria-orientation="vertical" onKeyDown={onKeyDown} className="scrollbar-none relative -mx-4 flex gap-2 overflow-x-auto px-4 lg:col-span-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
            {kits.map((item, index) => (
              <button
                key={item.slug}
                id={`${baseId}-tab-${index}`}
                role="tab"
                type="button"
                aria-selected={index === active}
                aria-controls={`${baseId}-panel`}
                tabIndex={index === active ? 0 : -1}
                onClick={() => setActive(index)}
                className={cx(
                  "group flex flex-none items-center justify-between gap-6 rounded-full px-5 py-3 text-left transition lg:rounded-none lg:border-b lg:border-cocoa-800/15 lg:px-0 lg:py-6",
                  index === active ? "bg-cocoa-800 text-cream-50 lg:bg-transparent lg:text-cocoa-900" : "bg-cream-50/60 text-cocoa-600 hover:text-cocoa-900 lg:bg-transparent",
                )}
              >
                <span>
                  <span className="hidden text-xs font-bold text-caramel-700 lg:block">{String(index + 1).padStart(2, "0")}</span>
                  <span className={cx("block font-display text-lg lg:text-[2rem] lg:leading-tight", index === active && "lg:italic")}>
                    {item.name.replace(/^ByMaster\s+/, "")}
                  </span>
                </span>
                <span className="hidden text-sm font-bold tabular-nums lg:block">
                  {item.comingSoon ? "Yakında" : item.priceKurus !== null ? formatTRY(item.priceKurus) : ""}
                </span>
              </button>
            ))}
          </div>

          <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${active}`} className="grid gap-8 lg:col-span-8 md:grid-cols-2">
            <div className="relative aspect-square overflow-hidden rounded-[1.6rem] bg-cream-100">
              {kit.imageUrl ? (
                <Image key={kit.imageUrl} src={kit.imageUrl} alt={kit.imageAlt} fill sizes="(min-width: 1024px) 30vw, 90vw" className="animate-fade-in object-cover" />
              ) : null}
              {kit.freeShipping ? (
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-cream-50 px-3 py-1.5 text-xs font-bold text-success">
                  <Truck className="size-3.5" aria-hidden="true" /> Kargo ücretsiz
                </span>
              ) : null}
            </div>
            <div className="flex flex-col">
              <p className="eyebrow">{kit.subtitle}</p>
              <p className="mt-2 font-display text-3xl text-cocoa-900">{kit.name.replace(/^ByMaster\s+/, "")}</p>
              {kit.comingSoon ? (
                <p className="mt-2 text-sm font-bold text-bordeaux-600">Yakında satışta</p>
              ) : kit.priceKurus !== null ? (
                <p className="mt-2 text-xl font-extrabold tabular-nums text-cocoa-900">
                  {formatTRY(kit.priceKurus)} <span className="text-xs font-semibold text-cocoa-500">KDV dahil</span>
                </p>
              ) : null}
              <div className="mt-6">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-cocoa-500">Kutuda neler var?</p>
                <ul className="mt-3 space-y-2">
                  {kit.contents.map((line) => (
                    <li key={line} className="flex gap-2.5 text-[0.95rem] text-cocoa-800">
                      <Check className="mt-1 size-4 flex-none text-caramel-600" aria-hidden="true" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              {kit.preparation.length > 0 ? (
                <div className="mt-6">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-cocoa-500">Nasıl hazırlanır?</p>
                  <ol className="mt-3 grid grid-cols-5 gap-2 text-center">
                    {kit.preparation.map((step, index) => (
                      <li key={step} className="rounded-xl bg-cream-50/70 p-2 text-[0.7rem] font-semibold leading-tight text-cocoa-700">
                        <span className="mb-1 block font-display text-lg text-caramel-700">{index + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
              <dl className="mt-6 grid gap-2 border-t border-cocoa-800/10 pt-4 text-sm">
                <div className="flex gap-2">
                  <dt className="font-bold text-cocoa-800">Porsiyon:</dt>
                  <dd className="text-cocoa-600">{kit.servingInfo ?? "Bilgi henüz eklenmedi."}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-bold text-cocoa-800">Alerjen:</dt>
                  <dd className="text-cocoa-600">{kit.allergens ?? "Bilgi henüz eklenmedi; satın almadan önce bize danışabilirsiniz."}</dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap items-start gap-3 pt-7">
                <Link href={`/urun/${kit.slug}`} className="btn btn-lg btn-outline group">
                  Kutuyu Keşfet
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                {kit.comingSoon ? (
                  <Link href={`/urun/${kit.slug}#haber-ver`} className="btn btn-lg btn-primary">
                    Satışa açılınca haber ver
                  </Link>
                ) : (
                  <BuyNow kit={kit} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
