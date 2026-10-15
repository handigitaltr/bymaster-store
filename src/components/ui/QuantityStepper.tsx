"use client";

import { Minus, Plus } from "lucide-react";
import { cx } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  disabled,
  size = "md",
  label = "Adet",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
}) {
  const clampValue = (next: number) => Math.min(max, Math.max(min, Number.isFinite(next) ? next : min));
  const height = size === "sm" ? "h-9" : "h-12";
  const button = size === "sm" ? "w-9" : "w-11";
  return (
    <div
      className={cx("inline-flex items-stretch rounded-full border border-cocoa-800/20 bg-white", height, disabled && "opacity-60")}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={cx("grid place-content-center rounded-l-full text-cocoa-700 hover:bg-cream-200 disabled:opacity-40", button)}
        onClick={() => onChange(clampValue(value - 1))}
        disabled={disabled || value <= min}
        aria-label="Azalt"
      >
        <Minus className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(clampValue(Number.parseInt(event.target.value, 10)))}
        className="w-12 border-x border-cocoa-800/10 bg-transparent text-center text-sm font-bold tabular-nums text-cocoa-900 focus:outline-none"
        aria-label={label}
      />
      <button
        type="button"
        className={cx("grid place-content-center rounded-r-full text-cocoa-700 hover:bg-cream-200 disabled:opacity-40", button)}
        onClick={() => onChange(clampValue(value + 1))}
        disabled={disabled || value >= max}
        aria-label="Artır"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
