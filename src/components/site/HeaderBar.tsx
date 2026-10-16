"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { useCart } from "@/components/cart/CartProvider";
import { Dialog } from "@/components/ui/Dialog";
import { STATIC_SITE } from "@/lib/site-mode";
import { cx } from "@/lib/utils";
import { MAIN_LINKS, type NavData } from "./nav-types";
import { SearchDialog } from "./SearchDialog";

export function HeaderBar({ nav }: { nav: NavData }) {
  const { me } = useCart();
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sayfa değişince açık menüleri kapat (render sırasında, önceki yolla karşılaştırarak)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMegaOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!STATIC_SITE && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape" && megaOpen) {
        setMegaOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [megaOpen]);

  useEffect(() => {
    if (!megaOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!megaRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [megaOpen]);

  const openMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  }, []);
  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 160);
  }, []);

  const cartCount = me?.cartCount ?? 0;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const productsActive = pathname.startsWith("/urunler") || pathname.startsWith("/kategori") || pathname.startsWith("/urun/");

  return (
    <>
      <header
        className={cx(
          "sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300",
          compact || megaOpen ? "border-cocoa-800/10 bg-cream-50/95 shadow-[0_8px_30px_-20px_rgb(53_28_22/0.45)] backdrop-blur-md" : "border-transparent bg-cream-50",
        )}
      >
        <div className={cx("container-page flex items-center gap-4 transition-[height] duration-300", compact ? "h-16" : "h-[4.75rem] lg:h-[5.5rem]")}>
          <button
            type="button"
            className="-ml-2 grid size-11 place-content-center rounded-full text-cocoa-800 hover:bg-cream-300 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Menüyü aç"
          >
            <Menu className="size-6" />
          </button>

          <Link href="/" className="mx-auto flex-none text-cocoa-800 lg:mx-0" aria-label="ByMaster ana sayfa">
            <Logo className={cx("transition-[width] duration-300", compact ? "w-[7.5rem]" : "w-[8.75rem] lg:w-[10rem]")} showDescriptor={!compact} />
          </Link>

          <nav aria-label="Ana menü" className="ml-6 hidden flex-1 items-center gap-1 lg:flex xl:ml-10">
            <div onMouseEnter={openMega} onMouseLeave={scheduleClose}>
              <button
                ref={triggerRef}
                type="button"
                aria-expanded={megaOpen}
                aria-controls="mega-menu"
                onClick={() => setMegaOpen((open) => !open)}
                className={cx(
                  "inline-flex h-10 items-center gap-1 rounded-full px-3.5 text-[0.9rem] font-bold transition-colors",
                  megaOpen || productsActive ? "text-bordeaux-600" : "text-cocoa-800 hover:text-bordeaux-600",
                )}
              >
                Ürünler
                <ChevronDown className={cx("size-4 transition-transform", megaOpen && "rotate-180")} aria-hidden="true" />
              </button>
            </div>
            {MAIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cx(
                  "inline-flex h-10 items-center rounded-full px-3.5 text-[0.9rem] font-bold transition-colors",
                  isActive(link.href) ? "text-bordeaux-600" : "text-cocoa-800 hover:text-bordeaux-600",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 lg:ml-auto">
            {/* Statik vitrinde arama, favoriler, hesap ve sepet sunucu gerektirdiği için yoktur */}
            {STATIC_SITE ? null : (
              <>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="grid size-11 place-content-center rounded-full text-cocoa-800 hover:bg-cream-300"
                  aria-label="Ara"
                >
                  <Search className="size-[1.3rem]" />
                </button>
                <Link
                  href="/favoriler"
                  className="hidden size-11 place-content-center rounded-full text-cocoa-800 hover:bg-cream-300 sm:grid"
                  aria-label="Favorilerim"
                >
                  <Heart className="size-[1.3rem]" />
                </Link>
                <Link
                  href={me?.user ? (me.user.isAdmin ? "/yonetim" : "/hesabim") : "/giris"}
                  className="hidden h-11 items-center gap-2 rounded-full px-3 text-cocoa-800 hover:bg-cream-300 sm:inline-flex"
                  aria-label={me?.user ? "Hesabım" : "Giriş yap"}
                >
                  <UserRound className="size-[1.3rem]" />
                  <span className="hidden text-sm font-bold xl:inline">{me?.user ? me.user.firstName : "Giriş"}</span>
                </Link>
                <Link
                  href="/sepet"
                  className="relative grid size-11 place-content-center rounded-full text-cocoa-800 hover:bg-cream-300"
                  aria-label={`Sepet, ${cartCount} ürün`}
                >
                  <ShoppingBag className="size-[1.3rem]" />
                  {cartCount > 0 ? (
                    <span className="absolute right-0.5 top-0.5 grid min-w-5 place-content-center rounded-full bg-bordeaux-600 px-1 text-[0.65rem] font-extrabold leading-5 text-white tabular-nums">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mega menü */}
        <div
          id="mega-menu"
          ref={megaRef}
          hidden={!megaOpen}
          onMouseEnter={openMega}
          onMouseLeave={scheduleClose}
          className="absolute inset-x-0 top-full hidden border-b border-cocoa-800/10 bg-cream-50 shadow-[0_30px_60px_-30px_rgb(53_28_22/0.45)] lg:block"
        >
          <div className="container-page grid grid-cols-12 gap-10 py-10">
            <div className="col-span-8 grid grid-cols-3 gap-8">
              {nav.groups.map((group) => (
                <div key={group.title}>
                  <p className="eyebrow mb-4">{group.title}</p>
                  <ul className="space-y-1">
                    {group.categories.map((category) => (
                      <li key={category.slug}>
                        <Link
                          href={`/kategori/${category.slug}`}
                          className="group flex items-baseline justify-between gap-3 rounded-lg py-2 font-display text-[1.15rem] text-cocoa-900 hover:text-bordeaux-600"
                        >
                          <span className="link-reveal">{category.name}</span>
                          <span className="font-sans text-xs font-bold text-cocoa-400 tabular-nums">{category.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="col-span-3 flex flex-wrap gap-x-8 gap-y-2 border-t border-cocoa-800/10 pt-5 text-sm font-bold">
                <Link href="/urunler" className="inline-flex items-center gap-1.5 text-cocoa-800 hover:text-bordeaux-600">
                  Tüm ürünler <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="/lezzet-dunyasi#lezzet-haritasi" className="inline-flex items-center gap-1.5 text-cocoa-800 hover:text-bordeaux-600">
                  Lezzet haritası <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="/profesyonel" className="inline-flex items-center gap-1.5 text-cocoa-800 hover:text-bordeaux-600">
                  Ambalaj ve toplu alım <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            {nav.feature ? (
              <Link
                href={nav.feature.href}
                className="group col-span-4 grid grid-cols-[1fr_9rem] items-center gap-4 overflow-hidden rounded-2xl bg-cocoa-800 p-6 text-cream-50"
              >
                <div>
                  <p className="eyebrow eyebrow-light mb-2">Öne çıkan</p>
                  <p className="font-display text-2xl leading-tight">{nav.feature.title}</p>
                  <p className="mt-2 text-sm text-cream-300">{nav.feature.caption}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-caramel-300">
                    İncele <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
                <div className="relative aspect-square overflow-hidden rounded-full bg-cream-100">
                  <Image src={nav.feature.imageUrl} alt={nav.feature.imageAlt} fill sizes="144px" className="object-contain p-2 mix-blend-multiply" />
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} title="Menü" variant="left">
        <div className="space-y-6 p-5">
          {STATIC_SITE ? null : (
            <form action="/arama" role="search" className="flex items-center gap-2 rounded-full border border-cocoa-800/15 bg-white px-4">
              <Search className="size-4 text-cocoa-400" aria-hidden="true" />
              <label htmlFor="mobile-search" className="sr-only">
                Ürün ara
              </label>
              <input id="mobile-search" name="q" type="search" placeholder="Ürün ara…" className="h-11 w-full bg-transparent text-base focus:outline-none" />
            </form>
          )}
          <nav aria-label="Mobil menü" className="space-y-1">
            <details className="group" open>
              <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-display text-2xl text-cocoa-900">
                Ürünler
                <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="space-y-4 pb-4 pl-1">
                {nav.groups.map((group) => (
                  <div key={group.title}>
                    <p className="eyebrow mb-1.5">{group.title}</p>
                    <ul>
                      {group.categories.map((category) => (
                        <li key={category.slug}>
                          <Link href={`/kategori/${category.slug}`} className="flex justify-between py-2 text-base font-semibold text-cocoa-800">
                            {category.name}
                            <span className="text-xs text-cocoa-400 tabular-nums">{category.count}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <Link href="/urunler" className="inline-flex items-center gap-1.5 py-1 text-sm font-bold text-bordeaux-600">
                  Tüm ürünler <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </details>
            {MAIN_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="block border-t border-cocoa-800/10 py-3 font-display text-2xl text-cocoa-900">
                {link.label}
              </Link>
            ))}
          </nav>
          {STATIC_SITE ? null : (
            <div className="grid grid-cols-2 gap-2.5 border-t border-cocoa-800/10 pt-5 text-sm font-bold">
              <Link href={me?.user ? "/hesabim" : "/giris"} className="btn btn-outline btn-sm">
                {me?.user ? "Hesabım" : "Giriş yap"}
              </Link>
              <Link href="/favoriler" className="btn btn-outline btn-sm">
                Favorilerim
              </Link>
              <Link href="/siparis-takip" className="btn btn-outline btn-sm">
                Sipariş takibi
              </Link>
              <Link href="/iletisim" className="btn btn-outline btn-sm">
                İletişim
              </Link>
            </div>
          )}
        </div>
      </Dialog>

      {STATIC_SITE ? null : <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </>
  );
}
