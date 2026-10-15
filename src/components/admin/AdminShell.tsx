"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Boxes,
  Briefcase,
  ClipboardList,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Package,
  Receipt,
  ScrollText,
  Settings,
  Tags,
  TicketPercent,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/brand/Logo";
import { cx } from "@/lib/utils";

type Badges = { orders: number; quotes: number; messages: number; returns: number };

const SECTIONS: Array<{ title: string; links: Array<{ href: string; label: string; icon: typeof Package; badge?: keyof Badges }> }> = [
  {
    title: "Genel",
    links: [
      { href: "/yonetim", label: "Panel", icon: LayoutDashboard },
      { href: "/yonetim/raporlar", label: "Raporlar", icon: BarChart3 },
    ],
  },
  {
    title: "Satış",
    links: [
      { href: "/yonetim/siparisler", label: "Siparişler", icon: Receipt, badge: "orders" },
      { href: "/yonetim/iadeler", label: "İade talepleri", icon: Undo2, badge: "returns" },
      { href: "/yonetim/teklifler", label: "B2B teklifler", icon: Briefcase, badge: "quotes" },
      { href: "/yonetim/musteriler", label: "Müşteriler", icon: Users },
      { href: "/yonetim/fiyat-listeleri", label: "B2B fiyat listeleri", icon: ClipboardList },
    ],
  },
  {
    title: "Katalog",
    links: [
      { href: "/yonetim/urunler", label: "Ürünler", icon: Package },
      { href: "/yonetim/kategoriler", label: "Kategoriler", icon: Tags },
      { href: "/yonetim/stok", label: "Stok ve fiyat", icon: Boxes },
      { href: "/yonetim/medya", label: "Medya", icon: ImageIcon },
    ],
  },
  {
    title: "Pazarlama ve içerik",
    links: [
      { href: "/yonetim/kuponlar", label: "Kuponlar", icon: TicketPercent },
      { href: "/yonetim/duyurular", label: "Duyuru bandı", icon: Megaphone },
      { href: "/yonetim/blog", label: "Blog ve tarifler", icon: BookOpen },
      { href: "/yonetim/sayfalar", label: "Sayfalar ve SSS", icon: FileText },
      { href: "/yonetim/bulten", label: "Bülten aboneleri", icon: Mail },
      { href: "/yonetim/mesajlar", label: "İletişim mesajları", icon: Inbox, badge: "messages" },
    ],
  },
  {
    title: "Sistem",
    links: [
      { href: "/yonetim/ayarlar", label: "Site ayarları", icon: Settings },
      { href: "/yonetim/denetim", label: "İşlem kayıtları", icon: ScrollText },
    ],
  },
];

export function AdminShell({
  children,
  userName,
  badges,
  paymentMode,
}: {
  children: React.ReactNode;
  userName: string;
  badges: Badges;
  paymentMode: "TEST" | "LIVE" | null;
}) {
  const pathname = usePathname();
  // Menü yalnızca açıldığı sayfada açık kalır; sayfa değişince kendiliğinden kapanır
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (value: boolean) => setOpenedAt(value ? pathname : null);

  const isActive = (href: string) => (href === "/yonetim" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <nav aria-label="Yönetim menüsü" className="space-y-6">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="px-3 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-cream-300/60">{section.title}</p>
          <ul className="mt-2 space-y-0.5">
            {section.links.map((link) => {
              const count = link.badge ? badges[link.badge] : 0;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cx(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                      isActive(link.href) ? "bg-cream-50 text-cocoa-900" : "text-cream-200 hover:bg-cream-50/10 hover:text-cream-50",
                    )}
                  >
                    <link.icon className="size-4 flex-none" aria-hidden="true" />
                    <span className="flex-1">{link.label}</span>
                    {count > 0 ? (
                      <span className="grid min-w-5 place-content-center rounded-full bg-bordeaux-500 px-1.5 text-[0.65rem] font-bold leading-5 text-white">{count}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#f6f2ec] text-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto bg-cocoa-950 px-3 py-6 lg:flex">
        <Link href="/yonetim" className="mb-8 px-3 text-cream-50" aria-label="Yönetim paneli">
          <Logo className="w-32" showDescriptor={false} />
        </Link>
        {nav}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-cocoa-950/60" aria-label="Menüyü kapat" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-cocoa-950 px-3 py-6">
            <button type="button" onClick={() => setOpen(false)} className="mb-6 ml-auto grid size-10 place-content-center rounded-full text-cream-100" aria-label="Kapat">
              <X className="size-5" />
            </button>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-cocoa-800/10 bg-[#f6f2ec]/95 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setOpen(true)} className="grid size-10 place-content-center rounded-full hover:bg-cream-300 lg:hidden" aria-label="Menüyü aç">
            <Menu className="size-5" />
          </button>
          {paymentMode ? (
            <span className={cx("pill", paymentMode === "TEST" ? "bg-bordeaux-600 text-white" : "bg-success text-white")}>
              Ödeme: {paymentMode === "TEST" ? "test modu" : "canlı"}
            </span>
          ) : (
            <span className="pill bg-cream-300 text-cocoa-700">Kart ödemesi yapılandırılmadı</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-cocoa-700 hover:bg-cream-300 sm:inline-flex">
              Siteyi görüntüle <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
            <span className="hidden text-sm text-cocoa-500 md:inline">{userName}</span>
            <form action={logoutAction}>
              <button type="submit" className="grid size-10 place-content-center rounded-full text-cocoa-600 hover:bg-cream-300" aria-label="Çıkış yap">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
