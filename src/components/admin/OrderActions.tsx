"use client";

import { useState } from "react";
import { recordRefundAction, saveOrderNoteAction, transitionOrderAction } from "@/app/actions/admin/orders";
import { ACheckbox, AdminForm, AField, ATextArea } from "@/components/admin/AdminForm";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

export function TransitionForm({ orderId, options }: { orderId: string; options: OrderStatus[] }) {
  const [to, setTo] = useState<OrderStatus | "">(options[0] ?? "");
  if (options.length === 0) return <p className="text-sm text-cocoa-500">Bu sipariş için başka durum geçişi yok.</p>;
  return (
    <AdminForm action={transitionOrderAction} submitLabel="Durumu güncelle">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor="to" className="field-label">
          Yeni durum
        </label>
        <select id="to" name="to" value={to} onChange={(event) => setTo(event.target.value as OrderStatus)} className="field-input">
          {options.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      {to === "SHIPPED" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <AField name="shippingCarrier" label="Kargo firması" placeholder="ör. Yurtiçi Kargo" />
          <AField name="trackingNumber" label="Takip numarası" required />
          <AField name="trackingUrl" label="Takip bağlantısı (isteğe bağlı)" placeholder="https://..." className="sm:col-span-2" />
        </div>
      ) : null}
      <ATextArea
        name="note"
        label={to === "PAID" ? "Açıklama (zorunlu — ör. havale referansı)" : "Not (müşteri sipariş geçmişinde görür)"}
        rows={2}
        maxLength={500}
      />
      {to === "PAID" ? (
        <p className="rounded-lg bg-[#fbf1dc] p-3 text-xs text-[#6b4607]">
          Ödemeyi elle onaylamadan önce tutarın hesabınıza geçtiğini banka veya ödeme kuruluşu panelinden doğrulayın.
        </p>
      ) : null}
      {to === "CANCELLED" ? (
        <p className="rounded-lg bg-bordeaux-50 p-3 text-xs text-bordeaux-700">
          İptal edilen siparişin stoğu otomatik olarak geri eklenir. Ödemesi alınmış siparişlerde ücret iadesini ödeme kuruluşu panelinden yapıp
          aşağıdan iade kaydı oluşturun.
        </p>
      ) : null}
      <ACheckbox name="notify" label="Müşteriye e-posta ile bildir" defaultChecked />
    </AdminForm>
  );
}

export function NoteForm({ orderId, defaultValue }: { orderId: string; defaultValue: string }) {
  return (
    <AdminForm action={saveOrderNoteAction} submitLabel="Notu kaydet" submitVariant="btn-outline">
      <input type="hidden" name="orderId" value={orderId} />
      <ATextArea name="adminNote" label="İç not (müşteri görmez)" rows={3} defaultValue={defaultValue} maxLength={2000} />
    </AdminForm>
  );
}

export function RefundForm({ orderId }: { orderId: string }) {
  return (
    <AdminForm action={recordRefundAction} submitLabel="İade kaydı oluştur" submitVariant="btn-outline" resetOnSuccess>
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="kind" value="REFUNDED" defaultChecked className="radio" /> Tam iade
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="kind" value="PARTIALLY_REFUNDED" className="radio" /> Kısmi iade
        </label>
      </div>
      <AField name="note" label="Açıklama / iade referansı" />
    </AdminForm>
  );
}
