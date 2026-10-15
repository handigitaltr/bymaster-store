// Ödeme sağlayıcılarının imza/doğrulama fonksiyonları (saf, birim testli).
import { createHmac } from "node:crypto";

// ---------------------------------------------------------------- PayTR

export type PaytrTokenFields = {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: number; // kuruş
  userBasket: string; // base64 JSON
  noInstallment: 0 | 1;
  maxInstallment: number;
  currency: string;
  testMode: 0 | 1;
};

/** PayTR iFrame API: paytr_token = base64(HMAC_SHA256(hash_str + merchant_salt, merchant_key)) */
export function paytrRequestToken(fields: PaytrTokenFields, merchantKey: string, merchantSalt: string): string {
  const hashStr =
    fields.merchantId +
    fields.userIp +
    fields.merchantOid +
    fields.email +
    String(fields.paymentAmount) +
    fields.userBasket +
    String(fields.noInstallment) +
    String(fields.maxInstallment) +
    fields.currency +
    String(fields.testMode);
  return createHmac("sha256", merchantKey).update(hashStr + merchantSalt).digest("base64");
}

/** PayTR bildirim (callback) hash'i: base64(HMAC_SHA256(merchant_oid + merchant_salt + status + total_amount, merchant_key)) */
export function paytrCallbackHash(
  merchantOid: string,
  status: string,
  totalAmount: string,
  merchantKey: string,
  merchantSalt: string,
): string {
  return createHmac("sha256", merchantKey).update(merchantOid + merchantSalt + status + totalAmount).digest("base64");
}

/** [[ürün adı, "birim fiyat", adet], ...] → base64 JSON */
export function paytrBasket(items: Array<[string, string, number]>): string {
  return Buffer.from(JSON.stringify(items), "utf8").toString("base64");
}

// ---------------------------------------------------------------- iyzico

/** iyzico IYZWSv2 kimlik doğrulama başlıkları */
export function iyzicoAuthHeaders(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  body: string,
  randomKey: string,
): Record<string, string> {
  const signature = createHmac("sha256", secretKey).update(randomKey + uriPath + body).digest("hex");
  const authorization = Buffer.from(`apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`).toString("base64");
  return {
    Authorization: `IYZWSv2 ${authorization}`,
    "x-iyzi-rnd": randomKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/** iyzico yanıt imzası: HMAC_SHA256(alanlar ':' ile birleştirilmiş, secretKey) hex */
export function iyzicoResponseSignature(secretKey: string, fields: Array<string | number | null | undefined>): string {
  return createHmac("sha256", secretKey)
    .update(fields.map((field) => (field === null || field === undefined ? "" : String(field))).join(":"))
    .digest("hex");
}

// ---------------------------------------------------------------- Test simülatörü

export function mockCallbackSignature(secret: string, reference: string, status: string, amountKurus: number): string {
  return createHmac("sha256", secret).update(`mock:${reference}:${status}:${amountKurus}`).digest("base64url");
}
