// Ortak doğrulama şemaları (sunucu tarafında her form için tekrar uygulanır)
import { z } from "zod";
import { normalizeTurkishPhone } from "./text";
import { SORTED_TR_CITIES } from "./constants";

z.config(z.locales.tr());

export { z };

export const emailSchema = z
  .string("E-posta adresinizi girin.")
  .trim()
  .toLowerCase()
  .max(160, "E-posta adresi çok uzun.")
  .pipe(z.email("Geçerli bir e-posta adresi girin."));

export const nameSchema = z
  .string("Ad soyad girin.")
  .trim()
  .min(3, "Ad soyad en az 3 karakter olmalıdır.")
  .max(80, "Ad soyad en fazla 80 karakter olabilir.")
  .regex(/^[\p{L}\s.'-]+$/u, "Ad soyad yalnızca harf içerebilir.");

export const phoneSchema = z
  .string("Telefon numaranızı girin.")
  .trim()
  .transform((value, ctx) => {
    const normalized = normalizeTurkishPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Geçerli bir telefon numarası girin (ör. 0532 123 45 67)." });
      return z.NEVER;
    }
    return normalized;
  });

export const passwordSchema = z
  .string("Şifre girin.")
  .min(10, "Şifre en az 10 karakter olmalıdır.")
  .max(128, "Şifre en fazla 128 karakter olabilir.")
  .refine((value) => /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(value) && /\d/.test(value), "Şifre en az bir harf ve bir rakam içermelidir.");

export const citySchema = z
  .string("İl seçin.")
  .trim()
  .refine((value) => (SORTED_TR_CITIES as readonly string[]).includes(value), "Listeden bir il seçin.");

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `En fazla ${max} karakter girebilirsiniz.`)
    .optional()
    .transform((value) => (value ? value : null));

export const requiredText = (label: string, min: number, max: number) =>
  z
    .string(`${label} girin.`)
    .trim()
    .min(min, `${label} en az ${min} karakter olmalıdır.`)
    .max(max, `${label} en fazla ${max} karakter olabilir.`);

export const taxNumberSchema = z
  .string("Vergi / T.C. kimlik numarası girin.")
  .trim()
  .regex(/^\d{10,11}$/, "Vergi numarası 10, T.C. kimlik numarası 11 haneli olmalıdır.");

export const checkboxTrue = (message: string) =>
  z.preprocess((value) => value === "on" || value === "true" || value === true, z.literal(true, message));

export const checkboxBool = z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean());

export function formObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") result[key] = value;
  }
  return result;
}

export type FieldErrors = Record<string, string[] | undefined>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
