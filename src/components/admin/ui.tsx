import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cx } from "@/lib/utils";

export function AdminHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-cocoa-500 hover:text-cocoa-900">
            <ChevronLeft className="size-4" aria-hidden="true" /> {back.label}
          </Link>
        ) : null}
        <h1 className="font-display text-3xl text-cocoa-900">{title}</h1>
        {description ? <p className="mt-1.5 max-w-3xl text-sm text-cocoa-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ id, title, children, className, actions }: { id?: string; title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section id={id} className={cx("rounded-2xl border border-cocoa-800/10 bg-white p-5 sm:p-6", className)}>
      {title || actions ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title ? <h2 className="font-display text-xl text-cocoa-900">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-x-auto rounded-2xl border border-cocoa-800/10 bg-white">
      <table className="w-full min-w-[44rem] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th scope="col" className={cx("border-b border-cocoa-800/10 bg-cream-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-cocoa-500", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cx("border-b border-cocoa-800/6 px-4 py-3 align-middle", className)}>{children}</td>;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-cocoa-500">
        {children}
      </td>
    </tr>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" | "dark" }) {
  const tones = {
    neutral: "bg-cream-300 text-cocoa-700",
    success: "bg-[#eaf3ec] text-[#21502c]",
    warning: "bg-[#fbf1dc] text-[#6b4607]",
    danger: "bg-bordeaux-50 text-bordeaux-700",
    info: "bg-[#e6eefb] text-[#1f4b8f]",
    dark: "bg-cocoa-800 text-cream-50",
  } as const;
  return <span className={cx("pill", tones[tone])}>{children}</span>;
}

export function SearchBar({
  action,
  defaultValue,
  placeholder = "Ara…",
  children,
}: {
  action: string;
  defaultValue?: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={action} className="mb-5 flex flex-wrap items-center gap-2">
      <div className="flex min-w-60 flex-1 items-center gap-2 rounded-full border border-cocoa-800/15 bg-white px-4">
        <Search className="size-4 text-cocoa-400" aria-hidden="true" />
        <label className="sr-only" htmlFor="admin-q">
          Ara
        </label>
        <input id="admin-q" name="q" type="search" defaultValue={defaultValue} placeholder={placeholder} className="h-10 w-full bg-transparent text-sm focus:outline-none" />
      </div>
      {children}
      <button type="submit" className="btn btn-sm btn-primary">
        Filtrele
      </button>
    </form>
  );
}

export function Pager({ page, pages, buildHref }: { page: number; pages: number; buildHref: (page: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Sayfalar" className="mt-5 flex items-center justify-between text-sm">
      <span className="text-cocoa-500">
        Sayfa {page} / {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={buildHref(page - 1)} className="btn btn-sm btn-outline">
            <ChevronLeft className="size-4" aria-hidden="true" /> Önceki
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={buildHref(page + 1)} className="btn btn-sm btn-outline">
            Sonraki <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export function StatCard({ label, value, hint, tone = "light" }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "light" | "dark" }) {
  return (
    <div className={cx("rounded-2xl border p-5", tone === "dark" ? "border-cocoa-900 bg-cocoa-900 text-cream-50" : "border-cocoa-800/10 bg-white")}>
      <p className={cx("text-xs font-bold uppercase tracking-wider", tone === "dark" ? "text-caramel-300" : "text-cocoa-500")}>{label}</p>
      <p className="mt-2 font-display text-3xl tabular-nums">{value}</p>
      {hint ? <p className={cx("mt-1 text-xs", tone === "dark" ? "text-cream-300" : "text-cocoa-500")}>{hint}</p> : null}
    </div>
  );
}

export function pageParam(value: string | undefined, max = 1000) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? Math.min(page, max) : 1;
}

/** Dosya indirme bağlantısı (route handler'a gider; istemci tarafı yönlendirme kullanılmaz) */
export function DownloadLink({ href, children, className = "btn btn-sm btn-outline" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} download className={className}>
      {children}
    </a>
  );
}
