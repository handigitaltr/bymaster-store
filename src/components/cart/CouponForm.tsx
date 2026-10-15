"use client";

import { TicketPercent, X } from "lucide-react";
import { applyCouponAction, removeCouponAction, type CartFormState } from "@/app/actions/cart";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useActionForm } from "@/lib/use-action-form";

export function CouponForm({ appliedCode, invalidMessage }: { appliedCode: string | null; invalidMessage: string | null }) {
  const { state, formAction: action, onSubmit } = useActionForm<CartFormState>(applyCouponAction, null);

  if (appliedCode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-cream-200 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-cocoa-900">
            <TicketPercent className="size-4 text-caramel-700" aria-hidden="true" />
            {appliedCode}
          </span>
          <form action={removeCouponAction}>
            <button type="submit" className="inline-flex items-center gap-1 text-xs font-bold text-cocoa-500 hover:text-bordeaux-600">
              <X className="size-3.5" aria-hidden="true" /> Kaldır
            </button>
          </form>
        </div>
        {invalidMessage ? (
          <p role="alert" className="text-xs font-semibold text-danger">
            {invalidMessage}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-2">
      <label htmlFor="coupon-code" className="field-label">
        İndirim kodu
      </label>
      <div className="flex gap-2">
        <input id="coupon-code" name="code" autoComplete="off" className="field-input uppercase" placeholder="KOD" maxLength={40} />
        <SubmitButton variant="btn-outline" pendingLabel="…">
          Uygula
        </SubmitButton>
      </div>
      {state?.message ? (
        <p role={state.tone === "error" ? "alert" : "status"} className={state.tone === "error" ? "text-xs font-semibold text-danger" : "text-xs font-semibold text-success"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
