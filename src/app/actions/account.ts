"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, requireUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroyOtherSessions } from "@/lib/auth/session";
import { RETURN_REASONS } from "@/lib/constants";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { returnRequestEmail } from "@/lib/email/templates";
import { canAccessOrder } from "@/lib/order-access";
import { readableCode } from "@/lib/security/crypto";
import { rateLimit, rateLimitMessage } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import { getSettings } from "@/lib/settings";
import {
  checkboxBool,
  citySchema,
  fieldErrors,
  formObject,
  nameSchema,
  optionalText,
  passwordSchema,
  phoneSchema,
  requiredText,
  z,
  type FieldErrors,
} from "@/lib/validation";

export type AccountState = { ok?: boolean; message?: string; errors?: FieldErrors } | null;

// ------------------------------------------------------------------ Profil

const profileSchema = z.object({
  name: nameSchema,
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .pipe(phoneSchema.optional()),
  accountType: z.enum(["INDIVIDUAL", "BUSINESS"]),
  companyName: optionalText(160),
  taxOffice: optionalText(80),
  taxNumber: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null)
    .refine((value) => value === null || /^\d{10,11}$/.test(value), "Vergi numarası 10 veya 11 haneli olmalıdır."),
  marketingConsent: checkboxBool,
});

export async function updateProfileAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser("/hesabim/profil");
  const parsed = profileSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      phone: data.phone ?? null,
      accountType: data.accountType,
      companyName: data.accountType === "BUSINESS" ? data.companyName : null,
      taxOffice: data.accountType === "BUSINESS" ? data.taxOffice : null,
      taxNumber: data.accountType === "BUSINESS" ? data.taxNumber : null,
      marketingConsent: data.marketingConsent,
      marketingConsentAt: data.marketingConsent && !user.marketingConsent ? new Date() : user.marketingConsentAt,
    },
  });
  revalidatePath("/hesabim");
  return { ok: true, message: "Bilgileriniz güncellendi." };
}

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifrenizi girin."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], message: "Şifreler eşleşmiyor." });

export async function changePasswordAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser("/hesabim/profil");
  const limit = await rateLimit("loginEmail", `pw:${user.id}`);
  if (!limit.ok) return { message: rateLimitMessage(limit.retryAfterSeconds) };
  const parsed = passwordChangeSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { errors: { currentPassword: ["Mevcut şifre hatalı."] } };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  await destroyOtherSessions(user.id);
  return { ok: true, message: "Şifreniz değiştirildi. Diğer cihazlardaki oturumlar kapatıldı." };
}

// ------------------------------------------------------------------ Adresler

const addressSchema = z.object({
  id: z.string().max(40).optional(),
  title: requiredText("Adres başlığı", 2, 40),
  fullName: nameSchema,
  phone: phoneSchema,
  city: citySchema,
  district: requiredText("İlçe", 2, 60),
  addressLine: requiredText("Adres", 10, 300),
  postalCode: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null)
    .refine((value) => value === null || /^\d{5}$/.test(value), "Posta kodu 5 haneli olmalıdır."),
  isDefault: checkboxBool,
});

export async function saveAddressAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser("/hesabim/adresler");
  const parsed = addressSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { id, ...data } = parsed.data;
  if (id) {
    const owned = await db.address.findFirst({ where: { id, userId: user.id }, select: { id: true } });
    if (!owned) return { message: "Adres bulunamadı." };
  } else if ((await db.address.count({ where: { userId: user.id } })) >= 10) {
    return { message: "En fazla 10 adres kaydedebilirsiniz." };
  }
  await db.$transaction(async (tx) => {
    if (data.isDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    if (id) await tx.address.update({ where: { id }, data });
    else await tx.address.create({ data: { ...data, userId: user.id } });
  });
  revalidatePath("/hesabim/adresler");
  return { ok: true, message: "Adres kaydedildi." };
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const user = await requireUser("/hesabim/adresler");
  const id = z.string().max(40).safeParse(formData.get("id"));
  if (id.success) await db.address.deleteMany({ where: { id: id.data, userId: user.id } });
  revalidatePath("/hesabim/adresler");
}

// ------------------------------------------------------------------ İade / sorun bildirimi

const returnSchema = z.object({
  orderNumber: z.string().regex(/^BM[0-9A-Z]{8,14}$/),
  reason: z.enum(RETURN_REASONS, "Bir neden seçin."),
  details: requiredText("Açıklama", 10, 2000),
  items: z.array(z.object({ orderItemId: z.string().max(40), quantity: z.coerce.number().int().min(1).max(999) })).min(1, "En az bir ürün seçin."),
});

export async function createReturnRequestAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const raw = formObject(formData);
  const items = Object.entries(raw)
    .filter(([key, value]) => key.startsWith("qty_") && Number(value) > 0)
    .map(([key, value]) => ({ orderItemId: key.slice(4), quantity: value }));
  const parsed = returnSchema.safeParse({ ...raw, items });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Lütfen formu kontrol edin." };

  const order = await db.order.findUnique({ where: { orderNumber: parsed.data.orderNumber }, include: { items: true } });
  const user = await getCurrentUser();
  if (!order || !(await canAccessOrder(order, user))) return { message: "Sipariş bulunamadı." };
  if (!["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status)) return { message: "Bu sipariş için talep oluşturulamaz." };

  const limit = await rateLimit("returnRequest", `${await getClientIp()}:${order.id}`);
  if (!limit.ok) return { message: rateLimitMessage(limit.retryAfterSeconds) };

  const validItems = parsed.data.items.filter((item) => {
    const orderItem = order.items.find((i) => i.id === item.orderItemId);
    return orderItem && item.quantity <= orderItem.quantity;
  });
  if (validItems.length === 0) return { errors: { items: ["Geçerli bir ürün ve adet seçin."] } };

  const referenceNo = `TLP-${readableCode(6)}`;
  await db.returnRequest.create({
    data: {
      referenceNo,
      orderId: order.id,
      userId: user?.id ?? null,
      email: order.email,
      reason: parsed.data.reason,
      details: parsed.data.details,
      items: { create: validItems.map((item) => ({ orderItemId: item.orderItemId, quantity: item.quantity })) },
    },
  });
  const settings = await getSettings();
  await sendEmail(order.email, returnRequestEmail(referenceNo, order.orderNumber, settings.storeName), "return-request");
  if (settings.orderNotificationEmail) {
    await sendEmail(
      settings.orderNotificationEmail,
      { subject: `Yeni iade/sorun talebi: ${referenceNo}`, html: `<p>${order.orderNumber} için yeni talep.</p><p><a href="${absoluteUrl("/yonetim/iadeler")}">Talepler</a></p>`, text: `${order.orderNumber} için yeni talep: ${absoluteUrl("/yonetim/iadeler")}` },
      "admin-return",
    );
  }
  redirect(`/siparis/${order.orderNumber}?talep=${referenceNo}`);
}
