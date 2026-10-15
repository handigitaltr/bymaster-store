"use client";

import { createReturnRequestAction, type AccountState } from "@/app/actions/account";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { RETURN_REASON_LABELS, RETURN_REASONS } from "@/lib/constants";
import { useActionForm } from "@/lib/use-action-form";

export function ReturnRequestForm({
  orderNumber,
  items,
}: {
  orderNumber: string;
  items: Array<{ id: string; name: string; variantName: string; quantity: number }>;
}) {
  const { state, formAction: action, onSubmit } = useActionForm<AccountState>(createReturnRequestAction, null);
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-6" noValidate>
      <input type="hidden" name="orderNumber" value={orderNumber} />
      {state?.message ? <Alert tone="error">{state.message}</Alert> : null}
      <fieldset>
        <legend className="field-label">İlgili ürünler ve adetler</legend>
        <ul className="mt-2 divide-y divide-cocoa-800/10 rounded-xl border border-cocoa-800/10">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 p-4">
              <label htmlFor={`qty-${item.id}`} className="text-sm">
                <span className="block font-bold text-cocoa-900">{item.name}</span>
                <span className="text-cocoa-500">{item.variantName} · siparişte {item.quantity} adet</span>
              </label>
              <select id={`qty-${item.id}`} name={`qty_${item.id}`} defaultValue="0" className="field-input !w-24">
                {Array.from({ length: item.quantity + 1 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
        {state?.errors?.items ? <p className="field-error">{state.errors.items[0]}</p> : null}
      </fieldset>
      <div>
        <label htmlFor="return-reason" className="field-label">
          Talep nedeni
        </label>
        <select id="return-reason" name="reason" className="field-input" defaultValue="">
          <option value="" disabled>
            Seçin
          </option>
          {RETURN_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {RETURN_REASON_LABELS[reason]}
            </option>
          ))}
        </select>
        {state?.errors?.reason ? <p className="field-error">{state.errors.reason[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="return-details" className="field-label">
          Açıklama
        </label>
        <textarea id="return-details" name="details" rows={5} maxLength={2000} className="field-input" placeholder="Yaşadığınız sorunu kısaca anlatın." />
        {state?.errors?.details ? <p className="field-error">{state.errors.details[0]}</p> : null}
        <p className="field-hint">Hasarlı ürün fotoğraflarını, talebiniz değerlendirilirken e-posta ile iletmeniz istenebilir.</p>
      </div>
      <SubmitButton pendingLabel="Gönderiliyor…">Talebi gönder</SubmitButton>
    </form>
  );
}
