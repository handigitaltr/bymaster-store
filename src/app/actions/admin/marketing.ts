"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { assertAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { parseLocalDateTime, type AdminFormState } from "@/lib/admin-form";
import { parseTRYToKurus } from "@/lib/money";
import { revalidateStorefront } from "@/lib/revalidate";
import { checkboxBool, fieldErrors, formObject, z } from "@/lib/validation";

// ------------------------------------------------------------------ Kuponlar

const couponSchema = z.object({
  id: z.string().max(40).optional(),
  code: z
    .string()
    .trim()
    .min(3, "Kod en az 3 karakter olmalıdır.")
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, "Kod yalnızca harf, rakam, - ve _ içerebilir."),
  description: z.string().trim().max(200).optional(),
  type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  value: z.string().trim().max(20).optional(),
  minSubtotal: z.string().trim().max(20).optional(),
  maxDiscount: z.string().trim().max(20).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  usageLimit: z.string().trim().max(10).optional(),
  usageLimitPerEmail: z.string().trim().max(10).optional(),
  isActive: checkboxBool,
});

function money(value: string | undefined): number | null | "invalid" {
  if (!value) return null;
  const kurus = parseTRYToKurus(value);
  return kurus === null ? "invalid" : kurus;
}

function intOrNull(value: string | undefined): number | null | "invalid" {
  if (!value) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : "invalid";
}

export async function saveCouponAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = couponSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Lütfen alanları kontrol edin." };
  const data = parsed.data;
  const code = data.code.toLocaleUpperCase("tr-TR");

  let value = 0;
  if (data.type === "PERCENT") {
    const percent = Number(data.value);
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) return { errors: { value: ["Yüzde 1 ile 90 arasında tam sayı olmalıdır."] } };
    value = percent;
  } else if (data.type === "FIXED") {
    const kurus = money(data.value);
    if (kurus === null || kurus === "invalid" || kurus <= 0) return { errors: { value: ["Geçerli bir tutar girin (ör. 100 veya 99,90)."] } };
    value = kurus;
  }
  const minSubtotal = money(data.minSubtotal);
  const maxDiscount = money(data.maxDiscount);
  const usageLimit = intOrNull(data.usageLimit);
  const usageLimitPerEmail = intOrNull(data.usageLimitPerEmail);
  if (minSubtotal === "invalid") return { errors: { minSubtotal: ["Geçerli bir tutar girin."] } };
  if (maxDiscount === "invalid") return { errors: { maxDiscount: ["Geçerli bir tutar girin."] } };
  if (usageLimit === "invalid") return { errors: { usageLimit: ["Pozitif tam sayı girin."] } };
  if (usageLimitPerEmail === "invalid") return { errors: { usageLimitPerEmail: ["Pozitif tam sayı girin."] } };
  const startsAt = parseLocalDateTime(data.startsAt ?? null);
  const endsAt = parseLocalDateTime(data.endsAt ?? null);
  if (startsAt && endsAt && endsAt <= startsAt) return { errors: { endsAt: ["Bitiş, başlangıçtan sonra olmalıdır."] } };

  const owner = await db.coupon.findUnique({ where: { code }, select: { id: true } });
  if (owner && owner.id !== data.id) return { errors: { code: ["Bu kod zaten kullanılıyor."] } };

  const values = {
    code,
    description: data.description || null,
    type: data.type,
    value,
    minSubtotalKurus: minSubtotal,
    maxDiscountKurus: data.type === "PERCENT" ? maxDiscount : null,
    startsAt,
    endsAt,
    usageLimit,
    usageLimitPerEmail,
    isActive: data.isActive,
  };
  const coupon = data.id ? await db.coupon.update({ where: { id: data.id }, data: values }) : await db.coupon.create({ data: values });
  await audit(admin.id, data.id ? "coupon.update" : "coupon.create", "Coupon", coupon.id, code);
  revalidatePath("/yonetim/kuponlar");
  return { ok: true, message: `${code} kaydedildi.` };
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = z.string().min(10).max(40).parse(formData.get("id"));
  const used = await db.couponRedemption.count({ where: { couponId: id } });
  if (used > 0) await db.coupon.update({ where: { id }, data: { isActive: false } });
  else await db.coupon.delete({ where: { id } });
  await audit(admin.id, used ? "coupon.deactivate" : "coupon.delete", "Coupon", id);
  revalidatePath("/yonetim/kuponlar");
}

// ------------------------------------------------------------------ Duyuru bandı

const announcementSchema = z.object({
  id: z.string().max(40).optional(),
  message: z.string().trim().min(3, "Mesaj girin.").max(160),
  linkUrl: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine((value) => !value || (value.startsWith("/") && !value.startsWith("//")), "Bağlantı site içi bir yol olmalıdır (ör. /urunler)."),
  linkLabel: z.string().trim().max(40).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: checkboxBool,
});

export async function saveAnnouncementAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = announcementSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Lütfen alanları kontrol edin." };
  const { id, ...data } = parsed.data;
  const values = {
    message: data.message,
    linkUrl: data.linkUrl || null,
    linkLabel: data.linkLabel || null,
    startsAt: parseLocalDateTime(data.startsAt ?? null),
    endsAt: parseLocalDateTime(data.endsAt ?? null),
    sortOrder: data.sortOrder,
    isActive: data.isActive,
  };
  const announcement = id ? await db.announcement.update({ where: { id }, data: values }) : await db.announcement.create({ data: values });
  await audit(admin.id, id ? "announcement.update" : "announcement.create", "Announcement", announcement.id, data.message);
  revalidateStorefront();
  revalidatePath("/yonetim/duyurular");
  return { ok: true, message: "Duyuru kaydedildi." };
}

export async function deleteAnnouncementAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = z.string().min(10).max(40).parse(formData.get("id"));
  await db.announcement.delete({ where: { id } });
  await audit(admin.id, "announcement.delete", "Announcement", id);
  revalidateStorefront();
  revalidatePath("/yonetim/duyurular");
}
