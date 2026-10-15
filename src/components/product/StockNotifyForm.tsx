"use client";

import { BellRing } from "lucide-react";
import { stockNotifyAction, type FormState } from "@/app/actions/forms";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useActionForm } from "@/lib/use-action-form";

export function StockNotifyForm({ variantId, comingSoon }: { variantId: string; comingSoon: boolean }) {
  const { state, formAction: action, onSubmit } = useActionForm<FormState>(stockNotifyAction, null);
  return (
    <div id="haber-ver" className="scroll-mt-32 rounded-2xl bg-cream-200 p-5">
      <p className="flex items-center gap-2 font-bold text-cocoa-900">
        <BellRing className="size-4 text-caramel-700" aria-hidden="true" />
        {comingSoon ? "Satışa açıldığında haber verelim" : "Stoğa girdiğinde haber verelim"}
      </p>
      {state?.ok ? (
        <p role="status" className="mt-2 text-sm text-success">
          {state.message}
        </p>
      ) : (
        <form action={action} onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row" noValidate>
          <input type="hidden" name="variantId" value={variantId} />
          <label htmlFor="notify-email" className="sr-only">
            E-posta adresiniz
          </label>
          <input
            id="notify-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="E-posta adresiniz"
            className="field-input flex-1"
            aria-invalid={state?.errors?.email ? true : undefined}
          />
          <SubmitButton pendingLabel="Kaydediliyor…">Haber ver</SubmitButton>
        </form>
      )}
      {state?.errors?.email ? <p className="field-error">{state.errors.email[0]}</p> : null}
      {state?.message && !state.ok ? <p className="field-error">{state.message}</p> : null}
      <p className="mt-2 text-xs text-cocoa-500">E-posta adresiniz yalnızca bu bildirim için kullanılır.</p>
    </div>
  );
}
