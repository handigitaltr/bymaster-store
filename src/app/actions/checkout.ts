"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canAccessOrder, grantOrderAccess } from "@/lib/order-access";
import { placeOrder, type CheckoutData } from "@/lib/orders";
import { startCardPayment } from "@/lib/payments/service";
import { revalidateProducts } from "@/lib/revalidate";
import { rateLimit, rateLimitMessage } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import {
  checkboxBool,
  checkboxTrue,
  citySchema,
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

export type CheckoutState = { message?: string; errors?: FieldErrors; code?: string } | null;

const checkoutSchema = z
  .object({
    fullName: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    shipFullName: nameSchema,
    shipPhone: phoneSchema,
    shipCity: citySchema,
    shipDistrict: requiredText("İlçe", 2, 60),
    shipAddressLine: requiredText("Adres", 10, 300),
    shipPostalCode: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || null)
      .refine((value) => value === null || /^\d{5}$/.test(value), "Posta kodu 5 haneli olmalıdır."),
    billingSame: checkboxBool,
    billType: z.enum(["INDIVIDUAL", "CORPORATE"], "Fatura türünü seçin."),
    billFullName: z.string().trim().max(80).optional(),
    billCity: z.string().trim().optional(),
    billDistrict: z.string().trim().max(60).optional(),
    billAddressLine: z.string().trim().max(300).optional(),
    billCompanyName: z.string().trim().max(160).optional(),
    billTaxOffice: z.string().trim().max(80).optional(),
    billTaxNumber: z.string().trim().optional(),
    paymentMethod: z.enum(["CARD", "BANK_TRANSFER"], "Bir ödeme yöntemi seçin."),
    note: optionalText(500),
    accept: checkboxTrue("Siparişi tamamlamak için sözleşmeleri onaylamanız gerekir."),
    marketing: checkboxBool,
    saveAddress: checkboxBool,
    expectedTotal: z.coerce.number().int().nonnegative(),
    idempotencyKey: z.string().regex(/^[0-9a-f-]{36}$/i, "Form süresi doldu, sayfayı yenileyin."),
  })
  .superRefine((value, ctx) => {
    if (!value.billingSame) {
      if (!value.billCity || !citySchema.safeParse(value.billCity).success) {
        ctx.addIssue({ code: "custom", path: ["billCity"], message: "Fatura ili seçin." });
      }
      if (!value.billDistrict || value.billDistrict.length < 2) {
        ctx.addIssue({ code: "custom", path: ["billDistrict"], message: "Fatura ilçesini girin." });
      }
      if (!value.billAddressLine || value.billAddressLine.length < 10) {
        ctx.addIssue({ code: "custom", path: ["billAddressLine"], message: "Fatura adresini girin (en az 10 karakter)." });
      }
    }
    if (value.billType === "CORPORATE") {
      if (!value.billCompanyName || value.billCompanyName.length < 2) {
        ctx.addIssue({ code: "custom", path: ["billCompanyName"], message: "Şirket unvanını girin." });
      }
      if (!value.billTaxOffice || value.billTaxOffice.length < 2) {
        ctx.addIssue({ code: "custom", path: ["billTaxOffice"], message: "Vergi dairesini girin." });
      }
      if (!value.billTaxNumber || !/^\d{10,11}$/.test(value.billTaxNumber)) {
        ctx.addIssue({ code: "custom", path: ["billTaxNumber"], message: "Vergi numarası 10, şahıs şirketlerinde T.C. kimlik no 11 haneli olmalıdır." });
      }
    } else if (!value.billingSame && (!value.billFullName || !nameSchema.safeParse(value.billFullName).success)) {
      ctx.addIssue({ code: "custom", path: ["billFullName"], message: "Fatura için ad soyad girin." });
    }
  });

export async function placeOrderAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const ip = await getClientIp();
  const limit = await rateLimit("checkout", ip);
  if (!limit.ok) return { message: rateLimitMessage(limit.retryAfterSeconds) };

  const parsed = checkoutSchema.safeParse(formObject(formData));
  if (!parsed.success) {
    return { message: "Lütfen işaretli alanları kontrol edin.", errors: fieldErrors(parsed.error) };
  }
  const input = parsed.data;
  const user = await getCurrentUser();

  const data: CheckoutData = {
    email: input.email,
    phone: input.phone,
    fullName: input.fullName,
    shipping: {
      fullName: input.shipFullName,
      phone: input.shipPhone,
      city: input.shipCity,
      district: input.shipDistrict,
      addressLine: input.shipAddressLine,
      postalCode: input.shipPostalCode,
    },
    billing: {
      type: input.billType,
      fullName: input.billingSame || !input.billFullName ? input.shipFullName : input.billFullName,
      city: input.billingSame ? input.shipCity : (input.billCity as string),
      district: input.billingSame ? input.shipDistrict : (input.billDistrict as string),
      addressLine: input.billingSame ? input.shipAddressLine : (input.billAddressLine as string),
      companyName: input.billType === "CORPORATE" ? (input.billCompanyName ?? null) : null,
      taxOffice: input.billType === "CORPORATE" ? (input.billTaxOffice ?? null) : null,
      taxNumber: input.billType === "CORPORATE" ? (input.billTaxNumber ?? null) : null,
    },
    paymentMethod: input.paymentMethod,
    note: input.note,
    marketingConsent: input.marketing,
    expectedTotalKurus: input.expectedTotal,
    idempotencyKey: input.idempotencyKey,
  };

  const result = await placeOrder(data, user);
  if (!result.ok) return { message: result.message, code: result.code };

  await grantOrderAccess(result.orderId);
  if (result.productSlugs.length) revalidateProducts(result.productSlugs);

  if (user && input.saveAddress) {
    const exists = await db.address.findFirst({
      where: { userId: user.id, addressLine: data.shipping.addressLine, city: data.shipping.city, district: data.shipping.district },
      select: { id: true },
    });
    if (!exists) {
      const count = await db.address.count({ where: { userId: user.id } });
      if (count < 10) {
        await db.address.create({
          data: {
            userId: user.id,
            title: count === 0 ? "Teslimat adresim" : `Adres ${count + 1}`,
            fullName: data.shipping.fullName,
            phone: data.shipping.phone,
            city: data.shipping.city,
            district: data.shipping.district,
            addressLine: data.shipping.addressLine,
            postalCode: data.shipping.postalCode,
            isDefault: count === 0,
            invoiceType: data.billing.type,
            companyName: data.billing.companyName,
            taxOffice: data.billing.taxOffice,
            taxNumber: data.billing.taxNumber,
          },
        });
      }
    }
  }

  if (data.paymentMethod === "CARD") {
    const payment = await startCardPayment(result.orderId, ip);
    if (payment.ok && payment.presentation.kind === "redirect") redirect(payment.presentation.url);
    redirect(`/odeme/${result.orderNumber}`);
  }
  redirect(`/siparis/${result.orderNumber}?yeni=1`);
}

/** Ödeme sayfasındaki "Ödemeye geç / Tekrar dene" düğmesi */
export async function startPaymentAction(formData: FormData): Promise<void> {
  const orderNumber = z.string().regex(/^BM[0-9A-Z]{8,14}$/).safeParse(formData.get("orderNumber"));
  if (!orderNumber.success) redirect("/");
  const order = await db.order.findUnique({ where: { orderNumber: orderNumber.data }, select: { id: true, userId: true } });
  const user = await getCurrentUser();
  if (!order || !(await canAccessOrder(order, user))) redirect("/siparis-takip");
  const ip = await getClientIp();
  const limit = await rateLimit("paymentStart", ip);
  if (!limit.ok) redirect(`/odeme/${orderNumber.data}?hata=limit`);
  const payment = await startCardPayment(order.id, ip);
  if (!payment.ok) redirect(`/odeme/${orderNumber.data}?hata=baslatilamadi`);
  // Harici ödeme sayfası (iyzico) veya test simülatörü: doğrudan yönlendir; PayTR iframe ödeme sayfasında gösterilir
  if (payment.presentation.kind === "redirect" || payment.presentation.kind === "simulator") redirect(payment.presentation.url);
  redirect(`/odeme/${orderNumber.data}`);
}
