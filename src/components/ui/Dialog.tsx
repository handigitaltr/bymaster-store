"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cx } from "@/lib/utils";

type Variant = "center" | "right" | "left";

/**
 * Yerel <dialog> tabanlı modal/çekmece: odak hapsetme, Esc ile kapatma ve arka plan
 * erişilebilirliği tarayıcı tarafından sağlanır.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  variant = "center",
  className,
  hideTitle = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  hideTitle?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      if (!open) document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);

  const variants: Record<Variant, string> = {
    center:
      "m-auto w-[min(40rem,calc(100vw-2rem))] max-h-[min(85dvh,52rem)] rounded-2xl open:animate-fade-in",
    right: "m-0 ml-auto h-dvh max-h-dvh w-full max-w-[28rem] open:animate-drawer-in",
    left: "m-0 mr-auto h-dvh max-h-dvh w-full max-w-[24rem] open:animate-fade-in",
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => {
        document.documentElement.style.overflow = "";
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cx(
        "overflow-hidden bg-cream-50 p-0 text-ink shadow-2xl backdrop:bg-cocoa-950/55 backdrop:backdrop-blur-[2px]",
        variants[variant],
        className,
      )}
    >
      <div className="flex h-full max-h-[inherit] flex-col">
        <div className={cx("flex items-start justify-between gap-4 border-b border-cocoa-800/10 px-5 py-4", hideTitle && "sr-only")}>
          <div>
            <h2 id={titleId} className="font-display text-xl text-cocoa-900">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-cocoa-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 grid size-10 flex-none place-content-center rounded-full text-cocoa-700 hover:bg-cream-300"
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </dialog>
  );
}
