import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cx } from "@/lib/utils";

const STYLES = {
  info: { box: "bg-cream-200 text-cocoa-800 ring-cocoa-800/10", Icon: Info },
  success: { box: "bg-[#eaf3ec] text-[#21502c] ring-[#2f6b3d]/20", Icon: CheckCircle2 },
  warning: { box: "bg-[#fbf1dc] text-[#6b4607] ring-[#87590a]/25", Icon: AlertTriangle },
  error: { box: "bg-bordeaux-50 text-bordeaux-700 ring-bordeaux-600/20", Icon: XCircle },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof STYLES;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { box, Icon } = STYLES[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("flex gap-3 rounded-xl p-4 text-sm ring-1", box, className)}>
      <Icon className="mt-0.5 size-5 flex-none" aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className="leading-relaxed [&_a]:font-semibold [&_a]:underline">{children}</div> : null}
      </div>
    </div>
  );
}
