"use server";

import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/guards";
import { burnPasswordCheck, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyCurrentSession } from "@/lib/auth/session";
import { mergeGuestCartIntoUser } from "@/lib/cart";
import { db } from "@/lib/db";
import { absoluteUrl, isTestPaymentMode } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates";
import { randomToken, sha256Hex } from "@/lib/security/crypto";
import { rateLimit, rateLimitMessage } from "@/lib/security/rate-limit";
import { getClientIp, getUserAgent } from "@/lib/security/request";
import { getSettings } from "@/lib/settings";
import { safeRedirectPath } from "@/lib/utils";
import {
  checkboxBool,
  checkboxTrue,
  emailSchema,
  fieldErrors,
  formObject,
  nameSchema,
  passwordSchema,
  z,
  type FieldErrors,
} from "@/lib/validation";

export type AuthState = { ok?: boolean; message?: string; errors?: FieldErrors; values?: Record<string, string> } | null;

const GENERIC_LOGIN_ERROR = "E-posta adresi veya şifre hatalı.";

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Şifrenizi girin.").max(128),
  next: z.string().max(200).optional(),
});

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = formObject(formData);
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { email: raw.email ?? "" } };
  const { email, password } = parsed.data;

  const ip = await getClientIp();
  const [byIp, byEmail] = await Promise.all([rateLimit("loginIp", ip), rateLimit("loginEmail", email)]);
  if (!byIp.ok || !byEmail.ok) {
    return { message: rateLimitMessage(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds)), values: { email } };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    await burnPasswordCheck(password);
    return { message: GENERIC_LOGIN_ERROR, values: { email } };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid || !user.isActive) return { message: GENERIC_LOGIN_ERROR, values: { email } };

  await createSession(user.id, user.role, await getUserAgent());
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await mergeGuestCartIntoUser(user.id);
  if (user.role === "ADMIN") await audit(user.id, "auth.login", "User", user.id, `IP özeti: ${sha256Hex(ip).slice(0, 12)}`);

  const fallback = user.role === "ADMIN" ? "/yonetim" : "/hesabim";
  redirect(safeRedirectPath(parsed.data.next, fallback));
}

const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
    kvkk: checkboxTrue("Devam etmek için aydınlatma metnini okuduğunuzu onaylayın."),
    marketing: checkboxBool,
    next: z.string().max(200).optional(),
  })
  .refine((value) => value.password === value.passwordConfirm, { path: ["passwordConfirm"], message: "Şifreler eşleşmiyor." });

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = formObject(formData);
  const parsed = registerSchema.safeParse(raw);
  const values = { name: raw.name ?? "", email: raw.email ?? "" };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const limit = await rateLimit("register", await getClientIp());
  if (!limit.ok) return { message: rateLimitMessage(limit.retryAfterSeconds), values };

  const exists = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (exists) {
    return {
      message: "Bu e-posta adresiyle hesap oluşturulamadı. Zaten hesabınız varsa giriş yapabilir veya şifrenizi sıfırlayabilirsiniz.",
      values,
    };
  }
  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      marketingConsent: parsed.data.marketing,
      marketingConsentAt: parsed.data.marketing ? new Date() : null,
    },
  });
  await createSession(user.id, user.role, await getUserAgent());
  await mergeGuestCartIntoUser(user.id);
  redirect(safeRedirectPath(parsed.data.next, "/hesabim?hosgeldin=1"));
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect("/");
}

const resetRequestSchema = z.object({ email: emailSchema });

export async function requestPasswordResetAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetRequestSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const ip = await getClientIp();
  const [byIp, byEmail] = await Promise.all([rateLimit("passwordReset", ip), rateLimit("passwordReset", `email:${parsed.data.email}`)]);
  const genericOk: AuthState = {
    ok: true,
    message: "Bu e-posta adresi kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen kutunuzu (ve istenmeyen klasörünü) kontrol edin.",
  };
  if (!byIp.ok || !byEmail.ok) return genericOk;

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user && user.isActive) {
    const token = randomToken(32);
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await db.passwordResetToken.create({
      data: { id: sha256Hex(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const settings = await getSettings();
    const resetUrl = absoluteUrl(`/sifre-sifirla?t=${token}`);
    const sent = await sendEmail(user.email, passwordResetEmail(resetUrl, settings.storeName), "password-reset");
    if (!sent && process.env.NODE_ENV !== "production" && isTestPaymentMode) {
      console.info(`[geliştirme] şifre sıfırlama bağlantısı: ${resetUrl}`);
    }
  }
  return genericOk;
}

const resetSchema = z
  .object({ token: z.string().min(20).max(100), password: passwordSchema, passwordConfirm: z.string() })
  .refine((value) => value.password === value.passwordConfirm, { path: ["passwordConfirm"], message: "Şifreler eşleşmiyor." });

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const record = await db.passwordResetToken.findUnique({ where: { id: sha256Hex(parsed.data.token) }, include: { user: true } });
  if (!record || record.usedAt || record.expiresAt < new Date() || !record.user.isActive) {
    return { message: "Bağlantının süresi dolmuş veya bağlantı geçersiz. Lütfen yeni bir sıfırlama bağlantısı isteyin." };
  }
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: record.userId } }),
  ]);
  redirect("/giris?sifre=yenilendi");
}

const deleteSchema = z.object({ password: z.string().min(1, "Şifrenizi girin."), confirm: checkboxTrue("Onay kutusunu işaretleyin.") });

/**
 * KVKK kapsamında hesap kapatma: kişisel profil verileri anonimleştirilir, adresler ve oturumlar silinir.
 * Siparişler, yasal saklama yükümlülükleri (fatura ve vergi mevzuatı) gereği sipariş anındaki bilgileriyle korunur.
 */
export async function deleteAccountAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const parsed = deleteSchema.safeParse(formObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  if (user.role === "ADMIN") return { message: "Yönetici hesapları bu ekrandan kapatılamaz." };
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return { errors: { password: ["Şifre hatalı."] } };
  await db.$transaction([
    db.address.deleteMany({ where: { userId: user.id } }),
    db.cart.deleteMany({ where: { userId: user.id } }),
    db.session.deleteMany({ where: { userId: user.id } }),
    db.user.update({
      where: { id: user.id },
      data: {
        email: `silindi-${user.id}@hesap-kapatildi.invalid`,
        name: "Kapatılmış hesap",
        phone: null,
        companyName: null,
        taxOffice: null,
        taxNumber: null,
        marketingConsent: false,
        isActive: false,
        passwordHash: await hashPassword(randomToken(24)),
      },
    }),
  ]);
  await destroyCurrentSession();
  redirect("/?hesap=kapatildi");
}
