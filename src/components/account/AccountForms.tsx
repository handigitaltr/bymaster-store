"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { deleteAccountAction, type AuthState } from "@/app/actions/auth";
import { changePasswordAction, deleteAddressAction, saveAddressAction, updateProfileAction, type AccountState } from "@/app/actions/account";
import { Alert } from "@/components/ui/Alert";
import { Dialog } from "@/components/ui/Dialog";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { formatPhoneForDisplay } from "@/lib/text";
import { useActionForm } from "@/lib/use-action-form";

type Address = {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode: string | null;
  isDefault: boolean;
};

function Field({
  name,
  label,
  defaultValue,
  error,
  type = "text",
  autoComplete,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  error?: string[];
  type?: string;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="field-label">
        {label}
      </label>
      <input id={`f-${name}`} name={name} type={type} defaultValue={defaultValue ?? ""} autoComplete={autoComplete} className="field-input" aria-invalid={error ? true : undefined} />
      {error ? <p className="field-error">{error[0]}</p> : null}
    </div>
  );
}

function AddressForm({ address, cities, onDone }: { address: Address | null; cities: string[]; onDone: () => void }) {
  const { state, formAction: action, onSubmit } = useActionForm<AccountState>(saveAddressAction, null);
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={action} onSubmit={onSubmit} className="grid gap-4 p-5 sm:grid-cols-2" noValidate>
      {address ? <input type="hidden" name="id" value={address.id} /> : null}
      {state?.message && !state.ok ? <Alert tone="error" className="sm:col-span-2">{state.message}</Alert> : null}
      <Field name="title" label="Adres başlığı" defaultValue={address?.title ?? "Ev"} error={state?.errors?.title} className="sm:col-span-2" />
      <Field name="fullName" label="Ad soyad" defaultValue={address?.fullName} error={state?.errors?.fullName} autoComplete="name" />
      <Field name="phone" label="Telefon" type="tel" defaultValue={address ? formatPhoneForDisplay(address.phone) : ""} error={state?.errors?.phone} autoComplete="tel" />
      <div>
        <label htmlFor="f-city" className="field-label">
          İl
        </label>
        <select id="f-city" name="city" defaultValue={address?.city ?? ""} className="field-input">
          <option value="">İl seçin</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        {state?.errors?.city ? <p className="field-error">{state.errors.city[0]}</p> : null}
      </div>
      <Field name="district" label="İlçe" defaultValue={address?.district} error={state?.errors?.district} />
      <div className="sm:col-span-2">
        <label htmlFor="f-addressLine" className="field-label">
          Açık adres
        </label>
        <textarea id="f-addressLine" name="addressLine" rows={3} defaultValue={address?.addressLine} className="field-input !min-h-24" />
        {state?.errors?.addressLine ? <p className="field-error">{state.errors.addressLine[0]}</p> : null}
      </div>
      <Field name="postalCode" label="Posta kodu (isteğe bağlı)" defaultValue={address?.postalCode} error={state?.errors?.postalCode} />
      <label className="flex items-center gap-3 self-end pb-3 text-sm text-cocoa-700">
        <input type="checkbox" name="isDefault" className="checkbox !mt-0" defaultChecked={address?.isDefault ?? false} /> Varsayılan adres
      </label>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Kaydediliyor…">Adresi kaydet</SubmitButton>
      </div>
    </form>
  );
}

export function AddressBook({ addresses, cities }: { addresses: Address[]; cities: string[] }) {
  const [editing, setEditing] = useState<Address | null | "new">(null);
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl text-cocoa-900">Adreslerim</h2>
        <button type="button" onClick={() => setEditing("new")} className="btn btn-sm btn-primary">
          <Plus className="size-4" aria-hidden="true" /> Yeni adres
        </button>
      </div>
      {addresses.length === 0 ? (
        <p className="mt-5 rounded-xl bg-cream-200 p-6 text-sm text-cocoa-600">Kayıtlı adresiniz yok. Ödeme adımında girdiğiniz adresi de kaydedebilirsiniz.</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-xl border border-cocoa-800/10 p-5 text-sm">
              <p className="flex items-center gap-2 font-bold text-cocoa-900">
                {address.title}
                {address.isDefault ? <span className="pill bg-cream-200 text-cocoa-700">Varsayılan</span> : null}
              </p>
              <p className="mt-2 text-cocoa-700">{address.fullName}</p>
              <p className="text-cocoa-500">{formatPhoneForDisplay(address.phone)}</p>
              <p className="mt-1 text-cocoa-600">
                {address.addressLine}, {address.district} / {address.city}
              </p>
              <div className="mt-4 flex gap-4">
                <button type="button" onClick={() => setEditing(address)} className="inline-flex items-center gap-1.5 text-xs font-bold text-cocoa-700 hover:text-cocoa-950">
                  <Pencil className="size-3.5" aria-hidden="true" /> Düzenle
                </button>
                <form action={deleteAddressAction}>
                  <input type="hidden" name="id" value={address.id} />
                  <button type="submit" className="inline-flex items-center gap-1.5 text-xs font-bold text-cocoa-500 hover:text-bordeaux-600">
                    <Trash2 className="size-3.5" aria-hidden="true" /> Sil
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Yeni adres" : "Adresi düzenle"}>
        {editing !== null ? (
          <AddressForm key={editing === "new" ? "new" : editing.id} address={editing === "new" ? null : editing} cities={cities} onDone={() => setEditing(null)} />
        ) : null}
      </Dialog>
    </div>
  );
}

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string; phone: string | null; accountType: string; companyName: string | null; taxOffice: string | null; taxNumber: string | null; marketingConsent: boolean };
}) {
  const { state, formAction: action, onSubmit } = useActionForm<AccountState>(updateProfileAction, null);
  const [business, setBusiness] = useState(user.accountType === "BUSINESS");
  return (
    <form action={action} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      {state?.message ? <Alert tone={state.ok ? "success" : "error"} className="sm:col-span-2">{state.message}</Alert> : null}
      <Field name="name" label="Ad soyad" defaultValue={user.name} error={state?.errors?.name} autoComplete="name" />
      <div>
        <p className="field-label">E-posta</p>
        <p className="flex min-h-[2.9rem] items-center text-sm text-cocoa-600">{user.email}</p>
      </div>
      <Field name="phone" label="Telefon (isteğe bağlı)" type="tel" defaultValue={user.phone ? formatPhoneForDisplay(user.phone) : ""} error={state?.errors?.phone} />
      <div>
        <p className="field-label">Hesap türü</p>
        <div className="flex gap-2">
          {[
            { value: "INDIVIDUAL", label: "Bireysel" },
            { value: "BUSINESS", label: "İşletme" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-cocoa-700">
              <input
                type="radio"
                name="accountType"
                value={option.value}
                className="radio"
                defaultChecked={user.accountType === option.value}
                onChange={() => setBusiness(option.value === "BUSINESS")}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      {business ? (
        <>
          <Field name="companyName" label="İşletme unvanı" defaultValue={user.companyName} error={state?.errors?.companyName} className="sm:col-span-2" />
          <Field name="taxOffice" label="Vergi dairesi" defaultValue={user.taxOffice} error={state?.errors?.taxOffice} />
          <Field name="taxNumber" label="Vergi numarası" defaultValue={user.taxNumber} error={state?.errors?.taxNumber} />
        </>
      ) : null}
      <label className="flex items-start gap-3 text-sm text-cocoa-700 sm:col-span-2">
        <input type="checkbox" name="marketingConsent" className="checkbox" defaultChecked={user.marketingConsent} />
        Kampanya ve yeniliklerden e-posta ile haberdar olmak istiyorum. Onayımı dilediğim zaman geri alabilirim.
      </label>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Kaydediliyor…">Bilgileri kaydet</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const { state, formAction: action, onSubmit } = useActionForm<AccountState>(changePasswordAction, null);
  const ref = useRef<HTMLFormElement>(null);
  // Şifre alanları başarılı değişiklikten sonra temizlenir
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      {state?.message ? <Alert tone={state.ok ? "success" : "error"} className="sm:col-span-2">{state.message}</Alert> : null}
      <Field name="currentPassword" label="Mevcut şifre" type="password" autoComplete="current-password" error={state?.errors?.currentPassword} className="sm:col-span-2" />
      <Field name="newPassword" label="Yeni şifre" type="password" autoComplete="new-password" error={state?.errors?.newPassword} />
      <Field name="confirmPassword" label="Yeni şifre (tekrar)" type="password" autoComplete="new-password" error={state?.errors?.confirmPassword} />
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Güncelleniyor…">Şifreyi değiştir</SubmitButton>
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const { state, formAction: action, onSubmit } = useActionForm<AuthState>(deleteAccountAction, null);
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4" noValidate>
      {state?.message ? <Alert tone="error">{state.message}</Alert> : null}
      <Field name="password" label="Şifreniz" type="password" autoComplete="current-password" error={state?.errors?.password} />
      <label className="flex items-start gap-3 text-sm text-cocoa-700">
        <input type="checkbox" name="confirm" className="checkbox" />
        Hesabımın kapatılmasını ve profil bilgilerimin silinmesini onaylıyorum. Yasal saklama süresi bulunan sipariş kayıtlarının korunacağını
        biliyorum.
      </label>
      {state?.errors?.confirm ? <p className="field-error">{state.errors.confirm[0]}</p> : null}
      <SubmitButton variant="btn-outline" pendingLabel="İşleniyor…">
        Hesabımı kapat
      </SubmitButton>
    </form>
  );
}
