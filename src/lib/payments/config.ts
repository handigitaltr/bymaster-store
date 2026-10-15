import "server-only";
import { env } from "@/lib/env";

export type CardProviderId = "paytr" | "iyzico" | "mock";

export const PROVIDER_LABELS: Record<string, string> = {
  paytr: "PayTR",
  iyzico: "iyzico",
  mock: "Test simülatörü",
  bank_transfer: "Havale / EFT",
};

/** Yapılandırılmış ve kullanılabilir kart ödeme sağlayıcısı (yoksa null) */
export function getCardProviderId(): CardProviderId | null {
  switch (env.PAYMENT_PROVIDER) {
    case "paytr":
      return env.PAYTR_MERCHANT_ID && env.PAYTR_MERCHANT_KEY && env.PAYTR_MERCHANT_SALT ? "paytr" : null;
    case "iyzico":
      return env.IYZICO_API_KEY && env.IYZICO_SECRET_KEY ? "iyzico" : null;
    case "mock":
      return env.PAYMENT_MODE === "test" ? "mock" : null;
    default:
      return null;
  }
}

export function paymentModeLabel(): "TEST" | "LIVE" {
  return env.PAYMENT_MODE === "live" ? "LIVE" : "TEST";
}

/** Sitede "test modu" uyarısı gösterilmeli mi? (kart sağlayıcısı test modunda etkinse) */
export function showTestModeBanner(): boolean {
  return env.PAYMENT_MODE === "test" && getCardProviderId() !== null;
}
