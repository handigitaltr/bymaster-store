"use client";

import Link from "next/link";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { quoteAction, type FormState } from "@/app/actions/forms";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { BUSINESS_TYPES, QUOTE_UNIT_LABELS, QUOTE_UNITS } from "@/lib/constants";
import { useActionForm } from "@/lib/use-action-form";

export type QuoteProductOption = { variantId: string; label: string; defaultUnit: string };
type Row = { key: number; variantId: string; productName: string; quantity: string; unit: string };

export function QuoteForm({
  options,
  initialVariantId,
  kvkkHref,
  cities,
}: {
  options: QuoteProductOption[];
  initialVariantId: string | null;
  kvkkHref: string | null;
  cities: string[];
}) {
  const { state, formAction: action, onSubmit } = useActionForm<FormState>(quoteAction, null);
  const initial = options.find((o) => o.variantId === initialVariantId);
  const [rows, setRows] = useState<Row[]>([
    { key: 1, variantId: initial?.variantId ?? "", productName: initial?.label ?? "", quantity: "", unit: initial?.defaultUnit ?? "KOVA" },
  ]);

  if (state?.ok) {
    return (
      <div className="rounded-[1.6rem] bg-[#eaf3ec] p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden="true" />
        <h2 className="mt-4 font-display text-3xl text-cocoa-900">Talebiniz alındı</h2>
        <p className="mt-3 text-cocoa-700">
          Referans numaranız: <strong className="font-mono">{state.reference}</strong>
        </p>
        <p className="mt-2 text-sm text-cocoa-600">Talebiniz değerlendirilerek belirttiğiniz iletişim bilgileri üzerinden size dönüş yapılacak.</p>
        <Link href="/urunler" className="btn btn-primary mt-6">
          Ürünlere dön
        </Link>
      </div>
    );
  }

  const update = (key: number, patch: Partial<Row>) => setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const error = (field: string) => state?.errors?.[field]?.[0];
  const serialized = JSON.stringify(
    rows
      .filter((row) => row.productName.trim())
      .map((row) => ({ variantId: row.variantId || undefined, productName: row.productName, quantity: row.quantity, unit: row.unit })),
  );

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-8" noValidate>
      {state?.message && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}
      <input type="hidden" name="items" value={serialized} />
      <div className="hidden" aria-hidden="true">
        <label htmlFor="q-website">Web sitesi</label>
        <input id="q-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="space-y-3">
        <legend className="font-display text-xl text-cocoa-900">Ürünler ve miktarlar</legend>
        {rows.map((row, index) => (
          <div key={row.key} className="grid gap-3 rounded-xl border border-cocoa-800/10 bg-white p-4 sm:grid-cols-[1fr_7rem_8rem_auto] sm:items-end">
            <div>
              <label htmlFor={`q-product-${row.key}`} className="field-label">
                Ürün {index + 1}
              </label>
              <select
                id={`q-product-${row.key}`}
                className="field-input"
                value={row.variantId}
                onChange={(event) => {
                  const option = options.find((o) => o.variantId === event.target.value);
                  update(row.key, { variantId: event.target.value, productName: option?.label ?? "", unit: option?.defaultUnit ?? row.unit });
                }}
              >
                <option value="">Ürün seçin…</option>
                {options.map((option) => (
                  <option key={option.variantId} value={option.variantId}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`q-qty-${row.key}`} className="field-label">
                Miktar
              </label>
              <input
                id={`q-qty-${row.key}`}
                type="number"
                min={1}
                inputMode="numeric"
                className="field-input"
                value={row.quantity}
                onChange={(event) => update(row.key, { quantity: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor={`q-unit-${row.key}`} className="field-label">
                Birim
              </label>
              <select id={`q-unit-${row.key}`} className="field-input" value={row.unit} onChange={(event) => update(row.key, { unit: event.target.value })}>
                {QUOTE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {QUOTE_UNIT_LABELS[unit]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setRows((current) => (current.length > 1 ? current.filter((r) => r.key !== row.key) : current))}
              disabled={rows.length === 1}
              className="grid size-11 place-content-center rounded-full text-cocoa-500 hover:bg-cream-200 hover:text-bordeaux-600 disabled:opacity-30"
              aria-label={`${index + 1}. ürünü kaldır`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {error("items") ? <p className="field-error">{error("items")}</p> : null}
        {rows.length < 30 ? (
          <button
            type="button"
            onClick={() => setRows((current) => [...current, { key: Date.now(), variantId: "", productName: "", quantity: "", unit: "KOVA" }])}
            className="inline-flex items-center gap-2 text-sm font-bold text-bordeaux-600"
          >
            <Plus className="size-4" aria-hidden="true" /> Ürün ekle
          </button>
        ) : null}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 font-display text-xl text-cocoa-900">İşletme ve iletişim bilgileri</legend>
        {[
          { name: "companyName", label: "İşletme adı", autoComplete: "organization", span: true },
          { name: "contactName", label: "Yetkili ad soyad", autoComplete: "name" },
          { name: "phone", label: "Telefon", autoComplete: "tel", type: "tel" },
          { name: "email", label: "E-posta", autoComplete: "email", type: "email", span: true },
        ].map((field) => (
          <div key={field.name} className={field.span ? "sm:col-span-2" : undefined}>
            <label htmlFor={`q-${field.name}`} className="field-label">
              {field.label}
            </label>
            <input
              id={`q-${field.name}`}
              name={field.name}
              type={field.type ?? "text"}
              autoComplete={field.autoComplete}
              defaultValue={state?.values?.[field.name]}
              className="field-input"
              aria-invalid={error(field.name) ? true : undefined}
            />
            {error(field.name) ? <p className="field-error">{error(field.name)}</p> : null}
          </div>
        ))}
        <div>
          <label htmlFor="q-city" className="field-label">
            İl (isteğe bağlı)
          </label>
          <select id="q-city" name="city" defaultValue={state?.values?.city ?? ""} className="field-input">
            <option value="">Seçin</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="q-type" className="field-label">
            İşletme türü (isteğe bağlı)
          </label>
          <select id="q-type" name="businessType" defaultValue={state?.values?.businessType ?? ""} className="field-input">
            <option value="">Seçin</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="q-message" className="field-label">
            Notunuz (isteğe bağlı)
          </label>
          <textarea
            id="q-message"
            name="message"
            rows={4}
            maxLength={3000}
            defaultValue={state?.values?.message}
            className="field-input"
            placeholder="Teslimat sıklığı, tahmini aylık tüketim gibi bilgiler teklifin netleşmesine yardımcı olur."
          />
        </div>
      </fieldset>

      <div>
        <div className="flex items-start gap-3">
          <input id="q-kvkk" name="kvkk" type="checkbox" className="checkbox" />
          <label htmlFor="q-kvkk" className="text-sm leading-relaxed text-cocoa-700">
            Talebimin değerlendirilmesi için iletişim bilgilerimin işlenmesine ilişkin{" "}
            {kvkkHref ? (
              <Link href={kvkkHref} target="_blank" className="font-semibold text-bordeaux-600 underline">
                aydınlatma metnini
              </Link>
            ) : (
              "aydınlatma metnini"
            )}{" "}
            okudum.
          </label>
        </div>
        {error("kvkk") ? <p className="field-error pl-8">{error("kvkk")}</p> : null}
      </div>

      <SubmitButton className="btn-lg" pendingLabel="Gönderiliyor…">
        Teklif talebini gönder
      </SubmitButton>
    </form>
  );
}
