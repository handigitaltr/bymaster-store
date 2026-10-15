import { PackageOpen, Paintbrush, ShoppingBag, Package } from "lucide-react";
import { PACKAGE_TYPE_LABELS, type PackageType } from "@/lib/constants";
import { formatWeight } from "@/lib/money";
import { cx } from "@/lib/utils";

function BucketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4.5 8h15l-1.6 11.2a1.5 1.5 0 0 1-1.5 1.3H7.6a1.5 1.5 0 0 1-1.5-1.3L4.5 8Z" />
      <path d="M3.5 8h17" />
      <path d="M5.5 8C5.5 4.7 8.4 3 12 3s6.5 1.7 6.5 5" />
    </svg>
  );
}

/**
 * Ambalaj biçimini net ayırt eden rozet: 10 kg kova ile 1 kg paket aynı biçimde gösterilmez.
 */
export function PackageBadge({
  packageType,
  netWeightGrams,
  tone = "light",
  className,
}: {
  packageType: string;
  netWeightGrams?: number | null;
  tone?: "light" | "dark";
  className?: string;
}) {
  const label = PACKAGE_TYPE_LABELS[packageType as PackageType] ?? packageType;
  const weight = formatWeight(netWeightGrams);
  const Icon = packageType === "KOVA" ? BucketIcon : packageType === "KUTU" ? PackageOpen : packageType === "SISE" ? Paintbrush : packageType === "KOLI" ? Package : ShoppingBag;
  const isPro = packageType === "KOVA";
  return (
    <span
      className={cx(
        "pill",
        tone === "dark"
          ? "bg-cream-50/12 text-cream-100 ring-1 ring-cream-50/25"
          : isPro
            ? "bg-cocoa-800 text-cream-50"
            : "bg-cream-50/90 text-cocoa-800 ring-1 ring-cocoa-800/15",
        className,
      )}
    >
      <Icon className="size-3.5" />
      <span>
        {label}
        {weight ? <span className="ml-1 font-semibold opacity-80">· {weight}</span> : null}
      </span>
    </span>
  );
}

/** Görselin köşesindeki gramaj damgası (kova/paket ayrımını görsel olarak da vurgular) */
export function WeightStamp({ packageType, netWeightGrams }: { packageType: string; netWeightGrams: number | null }) {
  if (packageType === "KUTU") {
    return (
      <span className="grid size-14 place-content-center rounded-full border border-cocoa-800/25 bg-cream-50/90 text-center font-display text-[0.8rem] font-semibold leading-none text-cocoa-800 backdrop-blur-sm">
        KİT
      </span>
    );
  }
  if (!netWeightGrams) return null;
  const kg = netWeightGrams >= 1000;
  const value = kg ? (netWeightGrams / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : String(netWeightGrams);
  const isBucket = packageType === "KOVA";
  return (
    <span
      className={cx(
        "grid size-14 place-content-center rounded-full text-center leading-none",
        isBucket ? "bg-cocoa-800 text-cream-50 shadow-lg" : "border border-cocoa-800/25 bg-cream-50/90 text-cocoa-800 backdrop-blur-sm",
      )}
      aria-hidden="true"
    >
      <span className="font-display text-lg font-semibold">{value}</span>
      <span className="text-[0.6rem] font-bold uppercase tracking-wider">{kg ? "kg" : "g"}</span>
    </span>
  );
}
