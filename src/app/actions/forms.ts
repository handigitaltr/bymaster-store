"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { BUSINESS_TYPES, CONTACT_SUBJECTS, QUOTE_UNITS } from "@/lib/constants";
import { NEWSLETTER_CONSENT_TEXT } from "@/lib/consents";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { adminContactEmail, adminNewQuoteEmail, newsletterWelcomeEmail, quoteReceivedEmail } from "@/lib/email/templates";
import { grantOrderAccess } from "@/lib/order-access";
import { randomToken, readableCode } from "@/lib/security/crypto";
import { rateLimit, rateLimitMessage } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import { getSettings } from "@/lib/settings";
import {
  checkboxTrue,
  emailSchema,
  fieldErrors,
  formObject,
  nameSchema,
  optionalText,
  phoneSchema,
  requiredText,
  z,
  type FieldErrors,
} from "@/lib/validation";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, string>;
  reference?: string;
} | null;

// ------------------------------------------------------------------ Bülten

const newsletterSchema = z.object({
  email: emailSchema,
  consent: checkboxTrue("Abonelik için ileti onayı gereklidir."),
  source: z.string().max(40).optional(),
});

export async function newsletterAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newsletterSchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const limit = await rateLimit("newsletter", await getClientIp());
  if (!limit.ok) return { ok: false, message: rateLimitMessage(limit.retryAfterSeconds) };

  const existing = await db.newsletterSubscription.findUnique({ where: { email: parsed.data.email } });
  if (existing?.status === "ACTIVE") {
    return { ok: true, message: "Bu e-posta adresi zaten bültenimize kayıtlı. Teşekkürler!" };
  }
  const unsubscribeToken = randomToken(24);
  await db.newsletterSubscription.upsert({
    where: { email: parsed.data.email },
    create: {
      email: parsed.data.email,
      consentText: NEWSLETTER_CONSENT_TEXT,
      source: parsed.data.source ?? "footer",
      unsubscribeToken,
    },
    update: { status: "ACTIVE", consentText: NEWSLETTER_CONSENT_TEXT, unsubscribedAt: null, unsubscribeToken },
  });
  const settings = await getSettings();
  await sendEmail(
    parsed.data.email,
    newsletterWelcomeEmail(absoluteUrl(`/bulten/ayril?t=${unsubscribeToken}`), settings.storeName),
    "newsletter-welcome",
  );
  return { ok: true, message: "Teşekkürler! Bültenimize abone oldunuz." };
}

export async function unsubscribeAction(token: string): Promise<{ ok: boolean }> {
  const parsed = z.string().min(20).max(80).safeParse(token);
  if (!parsed.success) return { ok: false };
  const updated = await db.newsletterSubscription.updateMany({
    where: { unsubscribeToken: parsed.data, status: "ACTIVE" },
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
  });
  return { ok: updated.count > 0 };
}

// ------------------------------------------------------------------ İletişim

const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .pipe(phoneSchema.optional()),
  subject: z.enum(CONTACT_SUBJECTS, "Bir konu seçin."),
  message: requiredText("Mesaj", 10, 3000),
  kvkk: checkboxTrue("Devam etmek için aydınlatma metnini okuduğunuzu onaylayın."),
  website: z.string().max(0).optional(), // bal küpü (bot) alanı
});

export async function contactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formObject(formData);
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values: raw };
  const limit = await rateLimit("contact", await getClientIp());
  if (!limit.ok) return { ok: false, message: rateLimitMessage(limit.retryAfterSeconds), values: raw };

  const message = await db.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
  });
  const settings = await getSettings();
  if (settings.orderNotificationEmail) {
    await sendEmail(
      settings.orderNotificationEmail,
      adminContactEmail(message, absoluteUrl("/yonetim/mesajlar"), settings.storeName),
      "admin-contact",
    );
  }
  return { ok: true, message: "Mesajınız bize ulaştı. En kısa sürede size dönüş yapacağız." };
}

// ------------------------------------------------------------------ B2B teklif talebi

const quoteItemSchema = z.object({
  variantId: z.string().max(40).optional().transform((value) => value || null),
  productName: z.string().trim().min(2).max(160),
  quantity: z.coerce.number().int().min(1, "Miktar en az 1 olmalıdır.").max(100000),
  unit: z.enum(QUOTE_UNITS),
});

const quoteSchema = z.object({
  companyName: requiredText("İşletme adı", 2, 120),
  contactName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  city: optionalText(40),
  businessType: z.enum(BUSINESS_TYPES).optional(),
  message: optionalText(3000),
  items: z.array(quoteItemSchema).min(1, "En az bir ürün ekleyin.").max(30),
  kvkk: checkboxTrue("Devam etmek için aydınlatma metnini okuduğunuzu onaylayın."),
  website: z.string().max(0).optional(),
});

export async function quoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formObject(formData);
  let items: unknown = [];
  try {
    items = JSON.parse(raw.items ?? "[]");
  } catch {
    items = [];
  }
  const parsed = quoteSchema.safeParse({ ...raw, items, businessType: raw.businessType || undefined });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values: raw };
  const limit = await rateLimit("quote", await getClientIp());
  if (!limit.ok) return { ok: false, message: rateLimitMessage(limit.retryAfterSeconds), values: raw };

  // Ürün adları sunucuda doğrulanır (istemciden gelen ada güvenilmez)
  const variantIds = parsed.data.items.map((item) => item.variantId).filter((id): id is string => Boolean(id));
  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, name: true, product: { select: { name: true } } },
  });
  const byId = new Map(variants.map((variant) => [variant.id, variant]));

  const user = await getCurrentUser();
  const referenceNo = `TKF-${readableCode(6)}`;
  const quote = await db.quoteRequest.create({
    data: {
      referenceNo,
      userId: user?.id ?? null,
      companyName: parsed.data.companyName,
      contactName: parsed.data.contactName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      city: parsed.data.city,
      businessType: parsed.data.businessType ?? null,
      message: parsed.data.message,
      kvkkConsentAt: new Date(),
      items: {
        create: parsed.data.items.map((item) => {
          const variant = item.variantId ? byId.get(item.variantId) : undefined;
          return {
            variantId: variant?.id ?? null,
            productName: variant?.product.name ?? item.productName,
            variantName: variant?.name ?? null,
            quantity: item.quantity,
            unit: item.unit,
          };
        }),
      },
      notes: { create: { kind: "STATUS_CHANGE", body: "Talep oluşturuldu." } },
    },
    include: { items: true },
  });

  const settings = await getSettings();
  await sendEmail(quote.email, quoteReceivedEmail(quote, settings.storeName), "quote-received");
  if (settings.orderNotificationEmail) {
    await sendEmail(
      settings.orderNotificationEmail,
      adminNewQuoteEmail(quote, absoluteUrl(`/yonetim/teklifler/${quote.id}`), settings.storeName),
      "admin-new-quote",
    );
  }
  return { ok: true, reference: referenceNo, message: "Talebiniz alındı." };
}

// ------------------------------------------------------------------ Stok / satış bildirimi

const notifySchema = z.object({ email: emailSchema, variantId: z.string().min(10).max(40) });

export async function stockNotifyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = notifySchema.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const limit = await rateLimit("stockNotify", await getClientIp());
  if (!limit.ok) return { ok: false, message: rateLimitMessage(limit.retryAfterSeconds) };
  const variant = await db.productVariant.findUnique({ where: { id: parsed.data.variantId }, select: { id: true } });
  if (!variant) return { ok: false, message: "Ürün bulunamadı." };
  await db.stockNotification.upsert({
    where: { variantId_email: { variantId: variant.id, email: parsed.data.email } },
    create: { variantId: variant.id, email: parsed.data.email },
    update: { notifiedAt: null },
  });
  return { ok: true, message: "Teşekkürler! Ürün satışa açıldığında size e-posta ile haber vereceğiz." };
}

// ------------------------------------------------------------------ Misafir sipariş sorgulama

const lookupSchema = z.object({
  orderNumber: z
    .string("Sipariş numarasını girin.")
    .trim()
    .toUpperCase()
    .regex(/^BM[0-9A-Z]{8,14}$/, "Sipariş numarası BM ile başlar (ör. BM261015K7QX)."),
  email: emailSchema,
});

export async function orderLookupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formObject(formData);
  const parsed = lookupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values: raw };
  const limit = await rateLimit("orderLookup", await getClientIp());
  if (!limit.ok) return { ok: false, message: rateLimitMessage(limit.retryAfterSeconds), values: raw };
  const order = await db.order.findUnique({ where: { orderNumber: parsed.data.orderNumber }, select: { id: true, email: true, orderNumber: true } });
  if (!order || order.email !== parsed.data.email) {
    return { ok: false, message: "Bu bilgilerle eşleşen bir sipariş bulunamadı.", values: raw };
  }
  await grantOrderAccess(order.id);
  redirect(`/siparis/${order.orderNumber}`);
}
