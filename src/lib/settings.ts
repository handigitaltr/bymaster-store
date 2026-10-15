import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const getSettings = cache(async () => {
  const existing = await db.siteSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return db.siteSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
});

export type Settings = Awaited<ReturnType<typeof getSettings>>;

export type BankAccount = { bankName: string; accountHolder: string; iban: string };

export function parseBankAccounts(json: string | null | undefined): BankAccount[] {
  if (!json) return [];
  try {
    const value = JSON.parse(json);
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (item): item is BankAccount =>
          item &&
          typeof item.bankName === "string" &&
          typeof item.accountHolder === "string" &&
          typeof item.iban === "string",
      )
      .map((item) => ({ bankName: item.bankName, accountHolder: item.accountHolder, iban: item.iban }));
  } catch {
    return [];
  }
}

export function shippingConfig(settings: Settings) {
  return {
    feeKurus: settings.shippingFeeKurus,
    freeThresholdKurus: settings.freeShippingThresholdKurus,
    vatRate: settings.shippingVatRate,
  };
}

export const LEGAL_PAGE_SLUGS = {
  preInformation: "on-bilgilendirme-formu",
  distanceSales: "mesafeli-satis-sozlesmesi",
  kvkk: "kvkk-aydinlatma-metni",
  privacy: "gizlilik-politikasi",
  cookies: "cerez-politikasi",
  returns: "iade-ve-iptal",
  shipping: "kargo-ve-teslimat",
} as const;

/** Adresi değiştirilemeyen / silinemeyen sayfalar (sitede sabit bağlantıları var) */
export const SYSTEM_PAGE_SLUGS: string[] = [...Object.values(LEGAL_PAGE_SLUGS), "hakkimizda"];

/** Sözleşme metinlerinde kullanılacak satıcı bilgileri eksik mi? */
export function missingSellerFields(settings: Settings): string[] {
  const missing: string[] = [];
  if (!settings.companyLegalName) missing.push("Şirket unvanı");
  if (!settings.companyAddress) missing.push("Şirket adresi");
  if (!settings.companyPhone && !settings.companyEmail) missing.push("Telefon veya e-posta");
  if (!settings.companyTaxNumber && !settings.companyMersis) missing.push("Vergi no veya MERSİS no");
  return missing;
}
