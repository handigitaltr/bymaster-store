import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { cx } from "@/lib/utils";

const TONES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-[#fbf1dc] text-[#6b4607]",
  AWAITING_TRANSFER: "bg-[#fbf1dc] text-[#6b4607]",
  PAID: "bg-[#e6eefb] text-[#1f4b8f]",
  PROCESSING: "bg-[#e6eefb] text-[#1f4b8f]",
  SHIPPED: "bg-[#eaf3ec] text-[#21502c]",
  DELIVERED: "bg-[#eaf3ec] text-[#21502c]",
  CANCELLED: "bg-bordeaux-50 text-bordeaux-700",
  EXPIRED: "bg-cream-300 text-cocoa-600",
};

export function OrderStatusPill({ status, className }: { status: string; className?: string }) {
  const key = status as OrderStatus;
  return <span className={cx("pill", TONES[key] ?? "bg-cream-300 text-cocoa-700", className)}>{ORDER_STATUS_LABELS[key] ?? status}</span>;
}
