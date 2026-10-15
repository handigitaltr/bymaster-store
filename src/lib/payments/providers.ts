import "server-only";
import { randomInt } from "node:crypto";
import { absoluteUrl, env } from "@/lib/env";
import { kurusToDecimalString } from "@/lib/money";
import { splitFullName } from "@/lib/text";
import { iyzicoAuthHeaders, iyzicoResponseSignature, paytrBasket, paytrRequestToken } from "./signatures";

export type ProviderOrder = {
  id: string;
  orderNumber: string;
  userId: string | null;
  email: string;
  phone: string;
  customerName: string;
  totalKurus: number;
  shippingKurus: number;
  shipFullName: string;
  shipCity: string;
  shipDistrict: string;
  shipAddressLine: string;
  shipPostalCode: string | null;
  billFullName: string;
  billCity: string;
  billDistrict: string;
  billAddressLine: string;
  createdAt: Date;
  items: Array<{
    id: string;
    productName: string;
    variantName: string;
    unitPriceKurus: number;
    quantity: number;
    lineTotalKurus: number;
    discountKurus: number;
  }>;
};

export type InitiateResult =
  | { ok: true; kind: "iframe"; token: string; src: string }
  | { ok: true; kind: "redirect"; token: string; url: string }
  | { ok: false; message: string };

const TIMEOUT_MS = 20_000;

// ------------------------------------------------------------------ PayTR

export async function paytrInitiate(order: ProviderOrder, reference: string, userIp: string, timeoutMinutes: number): Promise<InitiateResult> {
  const testMode: 0 | 1 = env.PAYMENT_MODE === "test" ? 1 : 0;
  const basketItems: Array<[string, string, number]> = order.items.map((item) => [
    `${item.productName} (${item.variantName})`.slice(0, 120),
    kurusToDecimalString(item.unitPriceKurus),
    item.quantity,
  ]);
  if (order.shippingKurus > 0) basketItems.push(["Kargo", kurusToDecimalString(order.shippingKurus), 1]);
  const userBasket = paytrBasket(basketItems);

  const fields = {
    merchantId: env.PAYTR_MERCHANT_ID,
    userIp,
    merchantOid: reference,
    email: order.email,
    paymentAmount: order.totalKurus,
    userBasket,
    noInstallment: 0 as const,
    maxInstallment: 0,
    currency: "TL",
    testMode,
  };
  const token = paytrRequestToken(fields, env.PAYTR_MERCHANT_KEY, env.PAYTR_MERCHANT_SALT);

  const body = new URLSearchParams({
    merchant_id: fields.merchantId,
    user_ip: userIp,
    merchant_oid: reference,
    email: order.email,
    payment_amount: String(order.totalKurus),
    paytr_token: token,
    user_basket: userBasket,
    debug_on: testMode ? "1" : "0",
    no_installment: "0",
    max_installment: "0",
    user_name: order.customerName.slice(0, 60),
    user_address: `${order.shipAddressLine} ${order.shipDistrict}/${order.shipCity}`.slice(0, 400),
    user_phone: order.phone.replace("+90", "0"),
    merchant_ok_url: absoluteUrl(`/siparis/${order.orderNumber}?odeme=tamam`),
    merchant_fail_url: absoluteUrl(`/siparis/${order.orderNumber}?odeme=hata`),
    timeout_limit: String(timeoutMinutes),
    currency: "TL",
    test_mode: String(testMode),
    lang: "tr",
  });

  try {
    const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json = (await response.json()) as { status?: string; token?: string; reason?: string };
    if (json.status === "success" && json.token) {
      return { ok: true, kind: "iframe", token: json.token, src: `https://www.paytr.com/odeme/guvenli/${json.token}` };
    }
    console.error("[PayTR] token alınamadı:", json.reason);
    return { ok: false, message: "Ödeme sayfası şu anda açılamadı. Lütfen biraz sonra tekrar deneyin." };
  } catch (error) {
    console.error("[PayTR] bağlantı hatası:", error instanceof Error ? error.message : error);
    return { ok: false, message: "Ödeme sağlayıcısına bağlanılamadı. Lütfen tekrar deneyin." };
  }
}

// ------------------------------------------------------------------ iyzico

const IYZICO_INIT_PATH = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
const IYZICO_DETAIL_PATH = "/payment/iyzipos/checkoutform/auth/ecom/detail";

async function iyzicoPost<T>(path: string, payload: unknown): Promise<T> {
  const body = JSON.stringify(payload);
  const randomKey = `${Date.now()}${randomInt(100000, 999999)}`;
  const response = await fetch(`${env.IYZICO_BASE_URL.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: iyzicoAuthHeaders(env.IYZICO_API_KEY, env.IYZICO_SECRET_KEY, path, body, randomKey),
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return (await response.json()) as T;
}

export async function iyzicoInitiate(order: ProviderOrder, reference: string, userIp: string): Promise<InitiateResult> {
  // iyzico'da sepet kalemlerinin toplamı 'price' alanına birebir eşit olmalı; indirim satırlara dağıtılmış haldedir.
  const basketItems = order.items
    .map((item) => ({
      id: item.id,
      name: `${item.productName} (${item.variantName})`.slice(0, 100),
      category1: "Gıda",
      itemType: "PHYSICAL",
      price: kurusToDecimalString(item.lineTotalKurus - item.discountKurus),
      amount: item.lineTotalKurus - item.discountKurus,
    }))
    .filter((item) => item.amount > 0);
  if (order.shippingKurus > 0) {
    basketItems.push({
      id: "KARGO",
      name: "Kargo",
      category1: "Kargo",
      itemType: "PHYSICAL",
      price: kurusToDecimalString(order.shippingKurus),
      amount: order.shippingKurus,
    });
  }
  const basketTotal = basketItems.reduce((sum, item) => sum + item.amount, 0);
  if (basketTotal !== order.totalKurus) {
    console.error("[iyzico] sepet toplamı sipariş toplamıyla uyuşmuyor", basketTotal, order.totalKurus);
    return { ok: false, message: "Ödeme başlatılamadı. Lütfen bizimle iletişime geçin." };
  }

  const buyerName = splitFullName(order.customerName);
  const shipAddress = `${order.shipAddressLine}, ${order.shipDistrict}`;
  const payload = {
    locale: "tr",
    conversationId: reference,
    price: kurusToDecimalString(order.totalKurus),
    paidPrice: kurusToDecimalString(order.totalKurus),
    currency: "TRY",
    basketId: order.orderNumber,
    paymentGroup: "PRODUCT",
    callbackUrl: absoluteUrl("/api/odeme/iyzico/donus"),
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id: order.userId ?? `misafir-${order.id}`,
      name: buyerName.name,
      surname: buyerName.surname,
      gsmNumber: order.phone,
      email: order.email,
      identityNumber: env.IYZICO_DEFAULT_IDENTITY_NUMBER,
      registrationAddress: shipAddress,
      ip: userIp,
      city: order.shipCity,
      country: "Turkey",
      zipCode: order.shipPostalCode ?? undefined,
    },
    shippingAddress: { contactName: order.shipFullName, city: order.shipCity, country: "Turkey", address: shipAddress },
    billingAddress: {
      contactName: order.billFullName,
      city: order.billCity,
      country: "Turkey",
      address: `${order.billAddressLine}, ${order.billDistrict}`,
    },
    basketItems: basketItems.map(({ id, name, category1, itemType, price }) => ({ id, name, category1, itemType, price })),
  };

  try {
    const json = await iyzicoPost<{
      status?: string;
      token?: string;
      paymentPageUrl?: string;
      errorMessage?: string;
      conversationId?: string;
      signature?: string;
    }>(IYZICO_INIT_PATH, payload);
    if (json.status === "success" && json.token && json.paymentPageUrl) {
      if (json.signature) {
        const expected = iyzicoResponseSignature(env.IYZICO_SECRET_KEY, [json.conversationId, json.token]);
        if (expected !== json.signature) {
          console.error("[iyzico] başlatma yanıtı imzası doğrulanamadı");
          return { ok: false, message: "Ödeme başlatılamadı. Lütfen tekrar deneyin." };
        }
      }
      return { ok: true, kind: "redirect", token: json.token, url: json.paymentPageUrl };
    }
    console.error("[iyzico] başlatılamadı:", json.errorMessage);
    return { ok: false, message: "Ödeme sayfası şu anda açılamadı. Lütfen biraz sonra tekrar deneyin." };
  } catch (error) {
    console.error("[iyzico] bağlantı hatası:", error instanceof Error ? error.message : error);
    return { ok: false, message: "Ödeme sağlayıcısına bağlanılamadı. Lütfen tekrar deneyin." };
  }
}

export type IyzicoDetail = {
  status?: string;
  paymentStatus?: string;
  paymentId?: string;
  paidPrice?: number | string;
  price?: number | string;
  currency?: string;
  basketId?: string;
  conversationId?: string;
  token?: string;
  fraudStatus?: number;
  errorCode?: string;
  errorMessage?: string;
  signature?: string;
};

/** Ödeme sonucunu iyzico'dan sunucu-sunucu sorgular (tarayıcıdan gelen veriye güvenilmez) */
export async function iyzicoRetrieve(token: string, conversationId: string): Promise<{ detail: IyzicoDetail; signatureValid: boolean | null }> {
  const detail = await iyzicoPost<IyzicoDetail>(IYZICO_DETAIL_PATH, { locale: "tr", conversationId, token });
  let signatureValid: boolean | null = null;
  if (detail.signature) {
    const expected = iyzicoResponseSignature(env.IYZICO_SECRET_KEY, [
      detail.paymentStatus,
      detail.paymentId,
      detail.currency,
      detail.basketId,
      detail.conversationId,
      detail.paidPrice,
      detail.price,
      detail.token,
    ]);
    signatureValid = expected === detail.signature;
  }
  return { detail, signatureValid };
}

export function decimalToKurus(value: number | string | undefined): number | null {
  if (value === undefined || value === null || value === "") return null;
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}
