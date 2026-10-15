"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Landmark, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { placeOrderAction, type CheckoutState } from "@/app/actions/checkout";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { Markdown } from "@/components/content/Markdown";
import { Alert } from "@/components/ui/Alert";
import { Dialog } from "@/components/ui/Dialog";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { track } from "@/lib/analytics";
import { orderVars, renderTemplate } from "@/lib/legal";
import { formatTRY } from "@/lib/money";
import type { Totals } from "@/lib/pricing";
import { useActionForm } from "@/lib/use-action-form";
import { cx } from "@/lib/utils";

type SavedAddress = {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode: string | null;
};

export type CheckoutFormProps = {
  user: { fullName: string; email: string; phone: string } | null;
  addresses: SavedAddress[];
  cities: string[];
  lines: Array<{ key: string; name: string; variantName: string; quantity: number; unitPriceKurus: number; lineTotalKurus: number; imageUrl: string | null; imageFit: string }>;
  totals: Totals;
  couponCode: string | null;
  payment: { card: { label: string; testMode: boolean } | null; bankTransfer: { holdHours: number } | null };
  legal: { preInformation: { title: string; content: string }; distanceSales: { title: string; content: string } };
  idempotencyKey: string;
  marketingLabel: string;
};

type Values = Record<string, string>;

function formatPhoneInput(phone: string) {
  const match = phone.match(/^\+90(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return match ? `0${match[1]} ${match[2]} ${match[3]} ${match[4]}` : phone;
}

export function CheckoutForm(props: CheckoutFormProps) {
  const router = useRouter();
  const { state, formAction: action, onSubmit } = useActionForm<CheckoutState>(placeOrderAction, null);
  const defaultAddress = props.addresses[0];
  const [selectedAddress, setSelectedAddress] = useState<string>(defaultAddress?.id ?? "new");
  const [values, setValues] = useState<Values>(() => ({
    fullName: props.user?.fullName ?? "",
    email: props.user?.email ?? "",
    phone: props.user?.phone ? formatPhoneInput(props.user.phone) : "",
    shipFullName: defaultAddress?.fullName ?? props.user?.fullName ?? "",
    shipPhone: defaultAddress ? formatPhoneInput(defaultAddress.phone) : props.user?.phone ? formatPhoneInput(props.user.phone) : "",
    shipCity: defaultAddress?.city ?? "",
    shipDistrict: defaultAddress?.district ?? "",
    shipAddressLine: defaultAddress?.addressLine ?? "",
    shipPostalCode: defaultAddress?.postalCode ?? "",
    billType: "INDIVIDUAL",
    billFullName: "",
    billCity: "",
    billDistrict: "",
    billAddressLine: "",
    billCompanyName: "",
    billTaxOffice: "",
    billTaxNumber: "",
    paymentMethod: props.payment.card ? "CARD" : "BANK_TRANSFER",
    note: "",
  }));
  const [billingSame, setBillingSame] = useState(true);
  const [legalOpen, setLegalOpen] = useState<null | "preInformation" | "distanceSales">(null);

  useEffect(() => {
    track("begin_checkout", {
      value: props.totals.totalKurus / 100,
      items: props.lines.map((line) => ({ item_id: line.key, item_name: line.name, price: line.unitPriceKurus / 100, quantity: line.quantity })),
    });
    // yalnızca ilk açılışta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state?.code && ["PRICE_CHANGED", "PROBLEMS", "COUPON", "OUT_OF_STOCK", "EMPTY"].includes(state.code)) router.refresh();
  }, [state, router]);

  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  const chooseAddress = (id: string) => {
    setSelectedAddress(id);
    const address = props.addresses.find((a) => a.id === id);
    setValues((current) => ({
      ...current,
      shipFullName: address?.fullName ?? current.fullName,
      shipPhone: address ? formatPhoneInput(address.phone) : current.phone,
      shipCity: address?.city ?? "",
      shipDistrict: address?.district ?? "",
      shipAddressLine: address?.addressLine ?? "",
      shipPostalCode: address?.postalCode ?? "",
    }));
  };

  const error = (key: string) => state?.errors?.[key]?.[0];

  const legalText = useMemo(() => {
    const billingAddress = billingSame
      ? `${values.shipAddressLine}, ${values.shipDistrict} / ${values.shipCity}`
      : `${values.billAddressLine}, ${values.billDistrict} / ${values.billCity}`;
    const billingSummary =
      values.billType === "CORPORATE"
        ? `${values.billCompanyName} — Vergi dairesi: ${values.billTaxOffice || "-"}, Vergi no: ${values.billTaxNumber || "-"} — ${billingAddress}`
        : `${billingSame ? values.shipFullName : values.billFullName || values.shipFullName} — ${billingAddress}`;
    const vars = orderVars({
      buyerName: values.fullName || "—",
      buyerEmail: values.email || "—",
      buyerPhone: values.phone || "—",
      shippingAddress: `${values.shipFullName}, ${values.shipAddressLine}, ${values.shipDistrict} / ${values.shipCity}`,
      billingSummary,
      paymentMethodLabel: values.paymentMethod === "CARD" ? "Kredi / banka kartı" : "Havale / EFT",
      items: props.lines.map((line) => ({ name: `${line.name} — ${line.variantName}`, quantity: line.quantity, unitPriceKurus: line.unitPriceKurus, lineTotalKurus: line.lineTotalKurus })),
      subtotalKurus: props.totals.subtotalKurus,
      discountKurus: props.totals.discountKurus,
      shippingKurus: props.totals.shippingKurus,
      totalKurus: props.totals.totalKurus,
      date: new Date(),
    });
    return {
      preInformation: renderTemplate(props.legal.preInformation.content, vars),
      distanceSales: renderTemplate(props.legal.distanceSales.content, vars),
    };
  }, [values, billingSame, props.lines, props.totals, props.legal]);

  const input = (key: string, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}, className = "") => (
    <div className={className}>
      <label htmlFor={`co-${key}`} className="field-label">
        {label}
      </label>
      <input
        id={`co-${key}`}
        name={key}
        value={values[key] ?? ""}
        onChange={set(key)}
        className="field-input"
        aria-invalid={error(key) ? true : undefined}
        aria-describedby={error(key) ? `co-${key}-error` : undefined}
        {...extra}
      />
      {error(key) ? (
        <p id={`co-${key}-error`} className="field-error">
          {error(key)}
        </p>
      ) : null}
    </div>
  );

  const citySelect = (key: string, label: string) => (
    <div>
      <label htmlFor={`co-${key}`} className="field-label">
        {label}
      </label>
      <select id={`co-${key}`} name={key} value={values[key] ?? ""} onChange={set(key)} className="field-input" aria-invalid={error(key) ? true : undefined}>
        <option value="">İl seçin</option>
        {props.cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
      {error(key) ? <p className="field-error">{error(key)}</p> : null}
    </div>
  );

  const step = (number: number, title: string, children: React.ReactNode, aside?: React.ReactNode) => (
    <section className="rounded-[1.4rem] border border-cocoa-800/10 bg-white p-5 sm:p-7" aria-labelledby={`step-${number}`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id={`step-${number}`} className="flex items-center gap-3 font-display text-xl text-cocoa-900">
          <span className="grid size-8 place-content-center rounded-full bg-cocoa-800 font-sans text-sm font-bold text-cream-50">{number}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-12">
      <input type="hidden" name="idempotencyKey" value={props.idempotencyKey} />
      <input type="hidden" name="expectedTotal" value={props.totals.totalKurus} />
      <input type="hidden" name="billingSame" value={billingSame ? "on" : ""} />

      <div className="space-y-6 lg:col-span-7 xl:col-span-8">
        {state?.message ? (
          <Alert tone="error" title="Sipariş tamamlanamadı">
            {state.message}{" "}
            {state.code && ["PRICE_CHANGED", "PROBLEMS", "OUT_OF_STOCK", "COUPON"].includes(state.code) ? (
              <Link href="/sepet">Sepete dön</Link>
            ) : null}
          </Alert>
        ) : null}

        {step(
          1,
          "İletişim bilgileri",
          <div className="grid gap-4 sm:grid-cols-2">
            {input("fullName", "Ad soyad", { autoComplete: "name", required: true }, "sm:col-span-2")}
            {input("email", "E-posta", { type: "email", autoComplete: "email", required: true, inputMode: "email" })}
            {input("phone", "Cep telefonu", { type: "tel", autoComplete: "tel", required: true, placeholder: "05XX XXX XX XX" })}
          </div>,
          props.user ? null : (
            <Link href="/giris?sonra=/odeme" className="text-sm font-bold text-bordeaux-600 hover:underline">
              Hesabınız var mı? Giriş yapın
            </Link>
          ),
        )}

        {step(
          2,
          "Teslimat adresi",
          <div className="space-y-5">
            {props.addresses.length > 0 ? (
              <fieldset>
                <legend className="field-label">Kayıtlı adreslerim</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[...props.addresses, { id: "new", title: "Yeni adres", fullName: "", phone: "", city: "", district: "", addressLine: "Farklı bir adres gir", postalCode: null }].map((address) => (
                    <label
                      key={address.id}
                      className={cx(
                        "flex cursor-pointer gap-3 rounded-xl border p-3.5 text-sm transition",
                        selectedAddress === address.id ? "border-cocoa-800 ring-1 ring-cocoa-800" : "border-cocoa-800/15 hover:border-cocoa-800/40",
                      )}
                    >
                      <input type="radio" className="radio mt-0.5" checked={selectedAddress === address.id} onChange={() => chooseAddress(address.id)} />
                      <span>
                        <span className="block font-bold text-cocoa-900">{address.title}</span>
                        <span className="block text-cocoa-500">
                          {address.id === "new" ? address.addressLine : `${address.addressLine}, ${address.district}/${address.city}`}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {input("shipFullName", "Alıcı ad soyad", { autoComplete: "shipping name" })}
              {input("shipPhone", "Alıcı telefonu", { type: "tel", autoComplete: "shipping tel", placeholder: "05XX XXX XX XX" })}
              {citySelect("shipCity", "İl")}
              {input("shipDistrict", "İlçe", { autoComplete: "shipping address-level2" })}
              <div className="sm:col-span-2">
                <label htmlFor="co-shipAddressLine" className="field-label">
                  Açık adres
                </label>
                <textarea
                  id="co-shipAddressLine"
                  name="shipAddressLine"
                  value={values.shipAddressLine}
                  onChange={set("shipAddressLine")}
                  rows={3}
                  autoComplete="shipping street-address"
                  placeholder="Mahalle, cadde/sokak, bina ve daire no"
                  className="field-input !min-h-24"
                  aria-invalid={error("shipAddressLine") ? true : undefined}
                />
                {error("shipAddressLine") ? <p className="field-error">{error("shipAddressLine")}</p> : null}
              </div>
              {input("shipPostalCode", "Posta kodu (isteğe bağlı)", { inputMode: "numeric", autoComplete: "shipping postal-code", maxLength: 5 })}
            </div>
            {props.user && selectedAddress === "new" ? (
              <label className="flex items-center gap-3 text-sm text-cocoa-700">
                <input type="checkbox" name="saveAddress" className="checkbox !mt-0" defaultChecked /> Bu adresi hesabıma kaydet
              </label>
            ) : null}
          </div>,
        )}

        {step(
          3,
          "Fatura bilgileri",
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Fatura türü">
              {[
                { value: "INDIVIDUAL", label: "Bireysel" },
                { value: "CORPORATE", label: "Kurumsal (şirket adına)" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={cx(
                    "flex cursor-pointer items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-semibold",
                    values.billType === option.value ? "border-cocoa-800 bg-cocoa-800 text-cream-50" : "border-cocoa-800/20 text-cocoa-700",
                  )}
                >
                  <input type="radio" name="billType" value={option.value} checked={values.billType === option.value} onChange={set("billType")} className="sr-only" />
                  {option.label}
                </label>
              ))}
            </div>
            {values.billType === "CORPORATE" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {input("billCompanyName", "Şirket unvanı", { autoComplete: "organization" }, "sm:col-span-2")}
                {input("billTaxOffice", "Vergi dairesi")}
                {input("billTaxNumber", "Vergi numarası", { inputMode: "numeric", maxLength: 11 })}
              </div>
            ) : null}
            <label className="flex items-center gap-3 text-sm text-cocoa-700">
              <input type="checkbox" className="checkbox !mt-0" checked={billingSame} onChange={(event) => setBillingSame(event.target.checked)} />
              Fatura adresi teslimat adresiyle aynı
            </label>
            {!billingSame ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {values.billType === "INDIVIDUAL" ? input("billFullName", "Fatura ad soyad", { autoComplete: "billing name" }, "sm:col-span-2") : null}
                {citySelect("billCity", "Fatura ili")}
                {input("billDistrict", "Fatura ilçesi")}
                <div className="sm:col-span-2">
                  <label htmlFor="co-billAddressLine" className="field-label">
                    Fatura adresi
                  </label>
                  <textarea
                    id="co-billAddressLine"
                    name="billAddressLine"
                    value={values.billAddressLine}
                    onChange={set("billAddressLine")}
                    rows={3}
                    className="field-input !min-h-24"
                    aria-invalid={error("billAddressLine") ? true : undefined}
                  />
                  {error("billAddressLine") ? <p className="field-error">{error("billAddressLine")}</p> : null}
                </div>
              </div>
            ) : null}
          </div>,
        )}

        {step(
          4,
          "Ödeme yöntemi",
          <div className="space-y-3">
            {props.payment.card ? (
              <label
                className={cx(
                  "flex cursor-pointer gap-4 rounded-xl border p-4 transition",
                  values.paymentMethod === "CARD" ? "border-cocoa-800 ring-1 ring-cocoa-800" : "border-cocoa-800/15",
                )}
              >
                <input type="radio" name="paymentMethod" value="CARD" className="radio mt-1" checked={values.paymentMethod === "CARD"} onChange={set("paymentMethod")} />
                <span>
                  <span className="flex items-center gap-2 font-bold text-cocoa-900">
                    <CreditCard className="size-4" aria-hidden="true" /> Kredi / banka kartı
                  </span>
                  <span className="mt-1 block text-sm text-cocoa-600">
                    Kart bilgileriniz {props.payment.card.label} güvenli ödeme sayfasında girilir; sitemizde saklanmaz.
                  </span>
                  {props.payment.card.testMode ? (
                    <span className="mt-2 inline-block rounded-md bg-bordeaux-50 px-2 py-1 text-xs font-bold text-bordeaux-700">
                      Test modu: gerçek tahsilat yapılmaz.
                    </span>
                  ) : null}
                </span>
              </label>
            ) : null}
            {props.payment.bankTransfer ? (
              <label
                className={cx(
                  "flex cursor-pointer gap-4 rounded-xl border p-4 transition",
                  values.paymentMethod === "BANK_TRANSFER" ? "border-cocoa-800 ring-1 ring-cocoa-800" : "border-cocoa-800/15",
                )}
              >
                <input type="radio" name="paymentMethod" value="BANK_TRANSFER" className="radio mt-1" checked={values.paymentMethod === "BANK_TRANSFER"} onChange={set("paymentMethod")} />
                <span>
                  <span className="flex items-center gap-2 font-bold text-cocoa-900">
                    <Landmark className="size-4" aria-hidden="true" /> Havale / EFT
                  </span>
                  <span className="mt-1 block text-sm text-cocoa-600">
                    Hesap bilgileri sipariş onayında gösterilir. Ödemeniz {props.payment.bankTransfer.holdHours} saat içinde ulaşmazsa sipariş iptal edilir.
                  </span>
                </span>
              </label>
            ) : null}
            {error("paymentMethod") ? <p className="field-error">{error("paymentMethod")}</p> : null}
            <div className="pt-2">
              <label htmlFor="co-note" className="field-label">
                Sipariş notu (isteğe bağlı)
              </label>
              <textarea id="co-note" name="note" value={values.note} onChange={set("note")} rows={2} maxLength={500} className="field-input !min-h-20" />
            </div>
          </div>,
        )}
      </div>

      <aside className="lg:col-span-5 xl:col-span-4" aria-label="Sipariş özeti">
        <div className="space-y-5 rounded-[1.4rem] border border-cocoa-800/10 bg-cream-100 p-6 lg:sticky lg:top-28">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-cocoa-900">Siparişiniz</h2>
            <Link href="/sepet" className="text-xs font-bold text-cocoa-600 underline">
              Sepeti düzenle
            </Link>
          </div>
          <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {props.lines.map((line) => (
              <li key={line.key} className="flex items-center gap-3">
                <span className="relative size-14 flex-none overflow-hidden rounded-lg bg-cream-200">
                  {line.imageUrl ? (
                    <Image src={line.imageUrl} alt="" fill sizes="56px" className={line.imageFit === "cover" ? "object-cover" : "object-contain p-1 mix-blend-multiply"} />
                  ) : null}
                  <span className="absolute right-0.5 top-0.5 grid min-w-5 place-content-center rounded-full bg-cocoa-800 px-1 text-[0.62rem] font-bold leading-5 text-cream-50">
                    {line.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-cocoa-900">{line.name}</span>
                  <span className="block text-xs text-cocoa-500">{line.variantName}</span>
                </span>
                <span className="text-sm font-bold tabular-nums">{formatTRY(line.lineTotalKurus)}</span>
              </li>
            ))}
          </ul>
          <OrderSummary totals={props.totals} couponCode={props.couponCode} />

          <div className="space-y-3 border-t border-cocoa-800/12 pt-4">
            <div>
              <div className="flex items-start gap-3">
                <input id="co-accept" name="accept" type="checkbox" className="checkbox" aria-invalid={error("accept") ? true : undefined} />
                <label htmlFor="co-accept" className="text-sm leading-relaxed text-cocoa-700">
                  <button type="button" onClick={() => setLegalOpen("preInformation")} className="font-bold text-bordeaux-600 underline">
                    Ön Bilgilendirme Formu
                  </button>
                  &apos;nu ve{" "}
                  <button type="button" onClick={() => setLegalOpen("distanceSales")} className="font-bold text-bordeaux-600 underline">
                    Mesafeli Satış Sözleşmesi
                  </button>
                  &apos;ni okudum, kabul ediyorum.
                </label>
              </div>
              {error("accept") ? <p className="field-error pl-8">{error("accept")}</p> : null}
            </div>
            <div className="flex items-start gap-3">
              <input id="co-marketing" name="marketing" type="checkbox" className="checkbox" />
              <label htmlFor="co-marketing" className="text-xs leading-relaxed text-cocoa-600">
                {props.marketingLabel}
              </label>
            </div>
          </div>

          <SubmitButton variant="btn-accent" className="btn-lg btn-block" pendingLabel="Sipariş oluşturuluyor…">
            <Lock className="size-4" aria-hidden="true" />
            {values.paymentMethod === "CARD" ? "Siparişi onayla ve öde" : "Siparişi onayla"} · {formatTRY(props.totals.totalKurus)}
          </SubmitButton>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-cocoa-500">
            <ShieldCheck className="mt-0.5 size-4 flex-none" aria-hidden="true" />
            Fiyatlar, stok ve kampanyalar siparişiniz oluşturulurken sunucuda yeniden doğrulanır.
          </p>
        </div>
      </aside>

      <Dialog
        open={legalOpen !== null}
        onClose={() => setLegalOpen(null)}
        title={legalOpen ? props.legal[legalOpen].title : ""}
        description="Siparişinize ait bilgilerle oluşturulmuştur."
        className="!w-[min(52rem,calc(100vw-1.5rem))]"
      >
        <div className="p-5 sm:p-7">{legalOpen ? <Markdown content={legalText[legalOpen]} compact /> : null}</div>
      </Dialog>
    </form>
  );
}
