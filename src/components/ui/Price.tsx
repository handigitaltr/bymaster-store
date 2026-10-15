import { formatTRY } from "@/lib/money";
import { cx } from "@/lib/utils";

export function Price({
  kurus,
  compareAtKurus,
  className,
  size = "md",
  vatNote = false,
}: {
  kurus: number;
  compareAtKurus?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  vatNote?: boolean;
}) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl", xl: "text-3xl md:text-4xl" } as const;
  return (
    <span className={cx("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cx("font-extrabold tracking-tight text-cocoa-900 tabular-nums", sizes[size])}>{formatTRY(kurus)}</span>
      {compareAtKurus && compareAtKurus > kurus ? (
        <span className="text-sm text-cocoa-500 line-through tabular-nums">
          <span className="sr-only">Önceki fiyat: </span>
          {formatTRY(compareAtKurus)}
        </span>
      ) : null}
      {vatNote ? <span className="text-xs font-semibold text-cocoa-500">KDV dahil</span> : null}
    </span>
  );
}
