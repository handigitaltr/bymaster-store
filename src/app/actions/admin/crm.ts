"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { assertAdmin } from "@/lib/auth/guards";
import { QUOTE_STATUSES, RETURN_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import type { AdminFormState } from "@/lib/admin-form";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { quoteReplyEmail } from "@/lib/email/templates";
import { parseTRYToKurus } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { checkboxBool, formObject, z } from "@/lib/validation";

// ------------------------------------------------------------------ B2B teklif talepleri

export async function updateQuoteAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = z
    .object({ id: z.string().min(10).max(40), status: z.enum(QUOTE_STATUSES), note: z.string().trim().max(2000).optional() })
    .safeParse(formObject(formData));
  if (!parsed.success) return { message: "Geçersiz istek." };
  const quote = await db.quoteRequest.findUnique({ where: { id: parsed.data.id } });
  if (!quote) return { message: "Talep bulunamadı." };
  await db.$transaction([
    db.quoteRequest.update({ where: { id: quote.id }, data: { status: parsed.data.status } }),
    ...(quote.status !== parsed.data.status
      ? [db.quoteNote.create({ data: { quoteRequestId: quote.id, kind: "STATUS_CHANGE", body: `Durum: ${quote.status} → ${parsed.data.status}`, actorId: admin.id } })]
      : []),
    ...(parsed.data.note ? [db.quoteNote.create({ data: { quoteRequestId: quote.id, kind: "NOTE", body: parsed.data.note, actorId: admin.id } })] : []),
  ]);
  await audit(admin.id, "quote.update", "QuoteRequest", quote.id, parsed.data.status);
  revalidatePath(`/yonetim/teklifler/${quote.id}`);
  revalidatePath("/yonetim/teklifler");
  return { ok: true, message: "Talep güncellendi." };
}

export async function replyQuoteAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = z.object({ id: z.string().min(10).max(40), message: z.string().trim().min(10, "Mesaj en az 10 karakter olmalıdır.").max(5000) }).safeParse(formObject(formData));
  if (!parsed.success) return { errors: { message: [parsed.error.issues[0]?.message ?? "Geçersiz mesaj."] } };
  if (!isEmailConfigured()) return { message: "E-posta gönderimi yapılandırılmadı (SMTP). Müşteriye telefon veya kendi e-posta istemcinizden ulaşabilirsiniz." };
  const quote = await db.quoteRequest.findUnique({ where: { id: parsed.data.id } });
  if (!quote) return { message: "Talep bulunamadı." };
  const settings = await getSettings();
  const sent = await sendEmail(quote.email, quoteReplyEmail(quote, parsed.data.message, settings.storeName), "quote-reply");
  if (!sent) return { message: "E-posta gönderilemedi. SMTP ayarlarını kontrol edin." };
  await db.quoteNote.create({ data: { quoteRequestId: quote.id, kind: "EMAIL_SENT", body: parsed.data.message, actorId: admin.id } });
  if (quote.status === "NEW") await db.quoteRequest.update({ where: { id: quote.id }, data: { status: "IN_REVIEW" } });
  await audit(admin.id, "quote.reply", "QuoteRequest", quote.id);
  revalidatePath(`/yonetim/teklifler/${quote.id}`);
  return { ok: true, message: "Yanıt e-postası gönderildi." };
}

// ------------------------------------------------------------------ İade talepleri

export async function updateReturnAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = z
    .object({
      id: z.string().min(10).max(40),
      status: z.enum(RETURN_STATUSES),
      adminNote: z.string().trim().max(2000).optional(),
      refundAmount: z.string().trim().max(20).optional(),
    })
    .safeParse(formObject(formData));
  if (!parsed.success) return { message: "Geçersiz istek." };
  const refund = parsed.data.refundAmount ? parseTRYToKurus(parsed.data.refundAmount) : null;
  if (parsed.data.refundAmount && refund === null) return { errors: { refundAmount: ["Geçerli bir tutar girin."] } };
  const request = await db.returnRequest.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status, adminNote: parsed.data.adminNote || null, refundAmountKurus: refund },
  });
  await audit(admin.id, "return.update", "ReturnRequest", request.id, parsed.data.status);
  revalidatePath(`/yonetim/iadeler/${request.id}`);
  revalidatePath("/yonetim/iadeler");
  return { ok: true, message: "Talep güncellendi. Müşteriyle iletişimi e-posta veya telefonla sürdürebilirsiniz." };
}

// ------------------------------------------------------------------ İletişim mesajları

export async function setMessageStatusAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const parsed = z.object({ id: z.string().min(10).max(40), status: z.enum(["NEW", "READ", "ARCHIVED"]) }).safeParse(formObject(formData));
  if (!parsed.success) return;
  await db.contactMessage.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  revalidatePath("/yonetim/mesajlar");
}

// ------------------------------------------------------------------ Müşteriler

export async function updateCustomerAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = z
    .object({ id: z.string().min(10).max(40), priceListId: z.string().max(40).optional(), isActive: checkboxBool, accountType: z.enum(["INDIVIDUAL", "BUSINESS"]) })
    .safeParse(formObject(formData));
  if (!parsed.success) return { message: "Geçersiz istek." };
  if (parsed.data.id === admin.id && !parsed.data.isActive) return { message: "Kendi hesabınızı pasife alamazsınız." };
  if (parsed.data.priceListId) {
    const exists = await db.priceList.findUnique({ where: { id: parsed.data.priceListId }, select: { id: true } });
    if (!exists) return { message: "Fiyat listesi bulunamadı." };
  }
  await db.user.update({
    where: { id: parsed.data.id },
    data: { priceListId: parsed.data.priceListId || null, isActive: parsed.data.isActive, accountType: parsed.data.accountType },
  });
  if (!parsed.data.isActive) await db.session.deleteMany({ where: { userId: parsed.data.id } });
  await audit(admin.id, "customer.update", "User", parsed.data.id, `aktif=${parsed.data.isActive}, fiyatListesi=${parsed.data.priceListId || "-"}`);
  revalidatePath(`/yonetim/musteriler/${parsed.data.id}`);
  return { ok: true, message: "Müşteri güncellendi." };
}

// ------------------------------------------------------------------ B2B fiyat listeleri

export async function savePriceListAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const raw = formObject(formData);
  const parsed = z
    .object({ id: z.string().max(40).optional(), name: z.string().trim().min(2, "Liste adı girin.").max(80), description: z.string().trim().max(300).optional(), isActive: checkboxBool })
    .safeParse(raw);
  if (!parsed.success) return { errors: { name: [parsed.error.issues[0]?.message ?? "Geçersiz ad."] } };

  // Satırlar: price_<variantId> ve min_<variantId>
  const entries: Array<{ variantId: string; priceKurus: number; minQty: number }> = [];
  for (const [key, value] of Object.entries(raw)) {
    if (!key.startsWith("price_") || !value.trim()) continue;
    const variantId = key.slice(6);
    const priceKurus = parseTRYToKurus(value);
    if (priceKurus === null || priceKurus <= 0) return { message: `Geçersiz fiyat: ${value}` };
    const minQty = Math.max(1, Number.parseInt(raw[`min_${variantId}`] ?? "1", 10) || 1);
    entries.push({ variantId, priceKurus, minQty });
  }
  const validVariants = await db.productVariant.findMany({ where: { id: { in: entries.map((e) => e.variantId) } }, select: { id: true } });
  const valid = new Set(validVariants.map((v) => v.id));

  const list = await db.$transaction(async (tx) => {
    const saved = parsed.data.id
      ? await tx.priceList.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name, description: parsed.data.description || null, isActive: parsed.data.isActive } })
      : await tx.priceList.create({ data: { name: parsed.data.name, description: parsed.data.description || null, isActive: parsed.data.isActive } });
    await tx.priceListEntry.deleteMany({ where: { priceListId: saved.id } });
    const rows = entries.filter((entry) => valid.has(entry.variantId));
    if (rows.length) await tx.priceListEntry.createMany({ data: rows.map((row) => ({ ...row, priceListId: saved.id })) });
    return saved;
  });
  await audit(admin.id, "pricelist.save", "PriceList", list.id, `${list.name} · ${entries.length} fiyat`);
  revalidatePath("/yonetim/fiyat-listeleri");
  return { ok: true, message: "Fiyat listesi kaydedildi. Listeyi müşteri detay sayfasından işletme hesaplarına atayabilirsiniz." };
}
