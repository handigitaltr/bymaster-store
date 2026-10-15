// Yasal metin şablonları: {{DEGISKEN}} biçimindeki alanları site ayarları ve sipariş bilgileriyle doldurur.
import { formatTRY } from "./money";

export type TemplateVars = Record<string, string>;

/** Kullanıcı kaynaklı metinlerdeki Markdown özel karakterlerini etkisizleştirir */
export function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_{}[\]()#+\-.!|>~<])/g, "\\$1").replace(/\r?\n/g, " ");
}

/**
 * Şablon değişkenlerini doldurur. Müşteriye gösterilen metinlerde eksik (isteğe bağlı) alanlar "—" olur;
 * yönetici önizlemesinde ise eksikler açıkça işaretlenir.
 */
export function renderTemplate(template: string, vars: TemplateVars, options: { markMissing?: boolean } = {}): string {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key: string) =>
    vars[key] ?? (options.markMissing ? `**[${key} — bilgi eksik]**` : "—"),
  );
}

export function sellerVars(settings: {
  companyLegalName: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyMersis: string | null;
  companyTaxOffice: string | null;
  companyTaxNumber: string | null;
  companyKep: string | null;
  storeName: string;
}, siteUrl: string): TemplateVars {
  const vars: TemplateVars = { MAGAZA_ADI: escapeMarkdown(settings.storeName), SITE_ADRESI: siteUrl };
  const add = (key: string, value: string | null) => {
    if (value) vars[key] = escapeMarkdown(value);
  };
  add("SATICI_UNVAN", settings.companyLegalName);
  add("SATICI_ADRES", settings.companyAddress);
  add("SATICI_TELEFON", settings.companyPhone);
  add("SATICI_EPOSTA", settings.companyEmail);
  add("SATICI_MERSIS", settings.companyMersis);
  add("SATICI_VERGI_DAIRESI", settings.companyTaxOffice);
  add("SATICI_VERGI_NO", settings.companyTaxNumber);
  add("SATICI_KEP", settings.companyKep);
  return vars;
}

/** Kargo sayfası değişkenleri (site ayarlarından) */
export function shippingVars(
  settings: {
    shippingFeeKurus: number | null;
    freeShippingThresholdKurus: number | null;
    shippingCarrierName: string | null;
    dispatchTimeText: string | null;
  },
): TemplateVars {
  const vars: TemplateVars = {};
  if (settings.shippingFeeKurus !== null) {
    vars.KARGO_UCRETI = settings.shippingFeeKurus === 0 ? "ücretsiz" : `${formatTRY(settings.shippingFeeKurus)} (KDV dahil)`;
  }
  vars.UCRETSIZ_KARGO_ESIGI =
    settings.freeShippingThresholdKurus !== null
      ? `${formatTRY(settings.freeShippingThresholdKurus)} ve üzeri siparişlerde kargo ücretsizdir.`
      : "";
  if (settings.shippingCarrierName) vars.KARGO_FIRMASI = escapeMarkdown(settings.shippingCarrierName);
  if (settings.dispatchTimeText) vars.GONDERIM_SURESI = escapeMarkdown(settings.dispatchTimeText);
  return vars;
}

/** Sipariş dışında görüntülenen sözleşme metinlerinde siparişe özgü alanlar */
export const ORDER_PLACEHOLDER_VARS: TemplateVars = Object.fromEntries(
  [
    "ALICI_AD",
    "ALICI_EPOSTA",
    "ALICI_TELEFON",
    "TESLIMAT_ADRESI",
    "FATURA_BILGISI",
    "ODEME_YONTEMI",
    "URUN_TABLOSU",
    "ARA_TOPLAM",
    "INDIRIM",
    "KARGO",
    "TOPLAM",
    "TARIH",
    "SIPARIS_NO",
  ].map((key) => [key, "*(sipariş sırasında doldurulur)*"]),
);

export type OrderTemplateInput = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  shippingAddress: string;
  billingSummary: string;
  paymentMethodLabel: string;
  items: Array<{ name: string; quantity: number; unitPriceKurus: number; lineTotalKurus: number }>;
  subtotalKurus: number;
  discountKurus: number;
  shippingKurus: number;
  totalKurus: number;
  date: Date;
  orderNumber?: string;
};

export function orderVars(input: OrderTemplateInput): TemplateVars {
  const rows = input.items
    .map(
      (item) =>
        `| ${escapeMarkdown(item.name)} | ${item.quantity} | ${formatTRY(item.unitPriceKurus)} | ${formatTRY(item.lineTotalKurus)} |`,
    )
    .join("\n");
  const table = `| Ürün | Adet | Birim fiyat (KDV dahil) | Tutar (KDV dahil) |\n|---|---|---|---|\n${rows}`;
  return {
    ALICI_AD: escapeMarkdown(input.buyerName),
    ALICI_EPOSTA: escapeMarkdown(input.buyerEmail),
    ALICI_TELEFON: escapeMarkdown(input.buyerPhone),
    TESLIMAT_ADRESI: escapeMarkdown(input.shippingAddress),
    FATURA_BILGISI: escapeMarkdown(input.billingSummary),
    ODEME_YONTEMI: escapeMarkdown(input.paymentMethodLabel),
    URUN_TABLOSU: table,
    ARA_TOPLAM: formatTRY(input.subtotalKurus),
    INDIRIM: formatTRY(input.discountKurus),
    KARGO: input.shippingKurus === 0 ? "Ücretsiz" : formatTRY(input.shippingKurus),
    TOPLAM: formatTRY(input.totalKurus),
    TARIH: new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(
      input.date,
    ),
    SIPARIS_NO: input.orderNumber ?? "Sipariş onayında bildirilecektir",
  };
}
