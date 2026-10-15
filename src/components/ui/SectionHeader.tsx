import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cx } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  tone = "light",
  className,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: { href: string; label: string };
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div
      className={cx(
        "flex flex-col gap-5",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cx("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? <p className={cx("eyebrow mb-3", tone === "dark" && "eyebrow-light")}>{eyebrow}</p> : null}
        <Heading className={cx("display-lg", tone === "dark" ? "text-cream-50" : "text-cocoa-900")}>{title}</Heading>
        {description ? (
          <p className={cx("mt-4 text-base leading-relaxed md:text-lg", tone === "dark" ? "text-cream-300" : "text-cocoa-600")}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className={cx(
            "group inline-flex flex-none items-center gap-2 text-sm font-bold",
            tone === "dark" ? "text-cream-100" : "text-cocoa-800",
          )}
        >
          <span className="link-underline">{action.label}</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
