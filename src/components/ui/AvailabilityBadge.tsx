import { AVAILABILITY_LABELS, type Availability } from "@/lib/availability";
import { cx } from "@/lib/utils";

const DOTS: Record<Availability, string> = {
  IN_STOCK: "bg-success",
  LOW_STOCK: "bg-caramel-500",
  OUT_OF_STOCK: "bg-cocoa-300",
  COMING_SOON: "bg-bordeaux-500",
};

export function AvailabilityBadge({
  availability,
  stockLeft,
  className,
}: {
  availability: Availability;
  stockLeft?: number | null;
  className?: string;
}) {
  const label =
    availability === "LOW_STOCK" && stockLeft ? `Son ${stockLeft} adet` : AVAILABILITY_LABELS[availability];
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-xs font-semibold text-cocoa-600", className)}>
      <span className={cx("size-2 rounded-full", DOTS[availability])} aria-hidden="true" />
      {label}
    </span>
  );
}
