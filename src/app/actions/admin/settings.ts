"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { assertAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import type { AdminFormState } from "@/lib/admin-form";
import { parseTRYToKurus } from "@/lib/money";
import { revalidateStorefront } from "@/lib/revalidate";
import { normalizeTrIban, normalizeTurkishPhone } from "@/lib/text";
import { checkboxBool, fieldErrors, formObject, z } from "@/lib/validation";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `En fazla ${max} karakter.`)
    .optional()
    .transform((value) => value || null);

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(160)
  .optional()
  .refine((value) => !value || z.email().safeParse(value).success, "Geçerli bir e-posta adresi girin.")
  .transform((value) => value || null);

const httpsUrl = (hosts?: string[]) =>
  z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        if (url.protocol !== "https:") return false;
        return !hosts || hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
      } catch {
        return false;
      }
    }, hostsMessage(hosts))
    .transform((value) => value || null);

function hostsMessage(hosts?: string[]) {
  return hosts ? `https:// ile başlayan bir ${hosts.join(" / ")} adresi girin.` : "https:// ile başlayan geçerli bir adres girin.";
}

async function save(adminId: string, section: string, data: Record<string, unknown>) {
  await db.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  await audit(adminId, "settings.update", "SiteSettings", "1", section);
  revalidateStorefront();
  revalidatePath("/yonetim", "layout");
}

// ------------------------------------------------------------------ Satıcı ve iletişim bilgileri

const sellerSchema = z.object({
  storeName: z.string().trim().min(2, "Mağaza adı girin.").max(60),
  companyLegalName: text(200),
  companyAddress: text(400),
  companyPhone: text(40),
  companyEmail: optionalEmail,
  companyMersis: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{16}$/.test(value.replace(/\s/g, "")), "MERSİS numarası 16 haneli olmalıdır.")
    .transform((value) => (value ? value.replace(/\s/g, "") : null)),
  companyTaxOffice: text(80),
  companyTaxNumber: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{10,11}$/.test(value), "Vergi numarası 10, T.C. kimlik numarası 11 haneli olmalıdır.")
    .transform((value) => value || null),
  companyKep: optionalEmail,
  supportHours: text(120),
  whatsappPhone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || normalizeTurkishPhone(value) !== null, "Geçerli bir telefon numarası girin.")
    .transform((value) => (value ? normalizeTurkishPhone(value) : null)),
  instagramUrl: httpsUrl(["instagram.com"]),
  etbisUrl: httpsUrl(),
  orderNotificationEmail: optionalEmail,
});

export async function saveSellerSettingsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = sellerSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Lütfen işaretli alanları kontrol edin." };
  await save(admin.id, "satıcı ve iletişim", parsed.data);
  return { ok: true, message: "Satıcı ve iletişim bilgileri kaydedildi. Yasal metinler bu bilgilerle güncellendi." };
}

// ------------------------------------------------------------------ Kargo

const shippingSchema = z.object({
  shippingFee: z.string().trim().max(20).optional(),
  freeShippingThreshold: z.string().trim().max(20).optional(),
  shippingVatRate: z.coerce.number().refine((value) => [0, 1, 10, 20].includes(value), "KDV oranı 0, 1, 10 veya 20 olabilir."),
  shippingCarrierName: text(80),
  dispatchTimeText: text(160),
});

export async function saveShippingSettingsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = shippingSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { shippingFee, freeShippingThreshold, ...rest } = parsed.data;
  const fee = shippingFee ? parseTRYToKurus(shippingFee) : null;
  if (shippingFee && fee === null) return { errors: { shippingFee: ["Geçerli bir tutar girin (ör. 89,90)."] } };
  const threshold = freeShippingThreshold ? parseTRYToKurus(freeShippingThreshold) : null;
  if (freeShippingThreshold && (threshold === null || threshold <= 0)) return { errors: { freeShippingThreshold: ["Geçerli bir tutar girin."] } };
  await save(admin.id, "kargo", { ...rest, shippingFeeKurus: fee, freeShippingThresholdKurus: threshold });
  return {
    ok: true,
    message: fee === null ? "Kaydedildi. Kargo ücreti boş olduğu için sipariş alınmaz." : "Kargo ayarları kaydedildi.",
  };
}

// ------------------------------------------------------------------ Ödeme (havale/EFT ve süreler)

const paymentSchema = z.object({
  bankTransferEnabled: checkboxBool,
  bankAccounts: z.string().max(5000),
  bankTransferHoldHours: z.coerce.number().int("Tam sayı girin.").min(1, "En az 1 saat.").max(168, "En fazla 168 saat (7 gün)."),
  paymentReservationMinutes: z.coerce.number().int("Tam sayı girin.").min(10, "En az 10 dakika.").max(120, "En fazla 120 dakika."),
});

export async function savePaymentSettingsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = paymentSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  let rows: Array<{ bankName?: unknown; accountHolder?: unknown; iban?: unknown }>;
  try {
    rows = JSON.parse(parsed.data.bankAccounts);
    if (!Array.isArray(rows)) throw new Error();
  } catch {
    return { message: "Banka hesapları okunamadı." };
  }
  const accounts: Array<{ bankName: string; accountHolder: string; iban: string }> = [];
  for (const [index, row] of rows.slice(0, 6).entries()) {
    const bankName = String(row.bankName ?? "").trim().slice(0, 80);
    const accountHolder = String(row.accountHolder ?? "").trim().slice(0, 160);
    const rawIban = String(row.iban ?? "").trim();
    if (!bankName && !accountHolder && !rawIban) continue;
    const iban = normalizeTrIban(rawIban);
    if (!bankName || !accountHolder) return { message: `${index + 1}. hesap: banka adı ve alıcı unvanı zorunludur.`, errors: { bankAccounts: ["Eksik bilgi"] } };
    if (!iban) return { message: `${index + 1}. hesap: IBAN geçersiz (TR ile başlayan 26 karakter, kontrol hanesi doğru olmalı).`, errors: { bankAccounts: ["Geçersiz IBAN"] } };
    accounts.push({ bankName, accountHolder, iban });
  }
  if (parsed.data.bankTransferEnabled && accounts.length === 0) {
    return { message: "Havale/EFT'yi açmak için en az bir banka hesabı girin.", errors: { bankAccounts: ["Hesap yok"] } };
  }
  await save(admin.id, "ödeme", {
    bankTransferEnabled: parsed.data.bankTransferEnabled,
    bankAccountsJson: accounts.length ? JSON.stringify(accounts) : null,
    bankTransferHoldHours: parsed.data.bankTransferHoldHours,
    paymentReservationMinutes: parsed.data.paymentReservationMinutes,
  });
  return { ok: true, message: "Ödeme ayarları kaydedildi." };
}

// ------------------------------------------------------------------ Analiz / pazarlama araçları

const integrationSchema = z.object({
  gaMeasurementId: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .refine((value) => !value || /^G-[A-Z0-9]{4,16}$/.test(value), "Ölçüm kimliği G-XXXXXXX biçiminde olmalıdır.")
    .transform((value) => value || null),
  metaPixelId: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d{6,20}$/.test(value), "Pixel kimliği yalnızca rakamlardan oluşur.")
    .transform((value) => value || null),
});

export async function saveIntegrationSettingsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = integrationSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await save(admin.id, "analiz araçları", parsed.data);
  return { ok: true, message: "Kaydedildi. Araçlar yalnızca ziyaretçi çerez onayı verdiğinde yüklenir." };
}
