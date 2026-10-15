"use client";

import { orderLookupAction, type FormState } from "@/app/actions/forms";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useActionForm } from "@/lib/use-action-form";

export function OrderLookupForm() {
  const { state, formAction: action, onSubmit } = useActionForm<FormState>(orderLookupAction, null);
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4" noValidate>
      {state?.message ? <Alert tone="error">{state.message}</Alert> : null}
      <div>
        <label htmlFor="lookup-order" className="field-label">
          Sipariş numarası
        </label>
        <input
          id="lookup-order"
          name="orderNumber"
          defaultValue={state?.values?.orderNumber}
          placeholder="BM261015K7QX"
          autoCapitalize="characters"
          className="field-input uppercase"
          aria-invalid={state?.errors?.orderNumber ? true : undefined}
        />
        {state?.errors?.orderNumber ? <p className="field-error">{state.errors.orderNumber[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="lookup-email" className="field-label">
          Siparişte kullandığınız e-posta
        </label>
        <input
          id="lookup-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state?.values?.email}
          className="field-input"
          aria-invalid={state?.errors?.email ? true : undefined}
        />
        {state?.errors?.email ? <p className="field-error">{state.errors.email[0]}</p> : null}
      </div>
      <SubmitButton pendingLabel="Sorgulanıyor…">Siparişi görüntüle</SubmitButton>
    </form>
  );
}
