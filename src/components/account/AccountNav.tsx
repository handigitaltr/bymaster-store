"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, Settings, Shield } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { cx } from "@/lib/utils";

const LINKS = [
  { href: "/hesabim", label: "Özet", icon: LayoutDashboard },
  { href: "/hesabim/siparisler", label: "Siparişlerim", icon: Package },
  { href: "/hesabim/adresler", label: "Adreslerim", icon: MapPin },
  { href: "/hesabim/profil", label: "Profil ve güvenlik", icon: Settings },
  { href: "/favoriler", label: "Favorilerim", icon: Heart },
];

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Hesap menüsü" className="scrollbar-none relative -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex flex-none items-center gap-3 rounded-full px-4 py-2.5 text-sm font-bold transition lg:rounded-xl",
              active ? "bg-cocoa-800 text-cream-50" : "text-cocoa-700 hover:bg-cream-200",
            )}
          >
            <link.icon className="size-4" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
      {isAdmin ? (
        <Link href="/yonetim" className="flex flex-none items-center gap-3 rounded-full px-4 py-2.5 text-sm font-bold text-bordeaux-600 hover:bg-cream-200 lg:rounded-xl">
          <Shield className="size-4" aria-hidden="true" /> Yönetim paneli
        </Link>
      ) : null}
      <form action={logoutAction} className="flex-none lg:mt-4 lg:border-t lg:border-cocoa-800/10 lg:pt-4">
        <button type="submit" className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-bold text-cocoa-500 hover:bg-cream-200 lg:rounded-xl">
          <LogOut className="size-4" aria-hidden="true" /> Çıkış yap
        </button>
      </form>
    </nav>
  );
}
