import "server-only";
import { z } from "zod";

const schema = z
  .object({
    DATABASE_URL: z.string().min(1),
    APP_URL: z.url(),
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET en az 32 karakter olmalıdır."),
    UPLOAD_DIR: z.string().min(1).default("./storage/uploads"),
    PAYMENT_PROVIDER: z.enum(["none", "paytr", "iyzico", "mock"]).default("none"),
    PAYMENT_MODE: z.enum(["test", "live"]).default("test"),
    PAYTR_MERCHANT_ID: z.string().default(""),
    PAYTR_MERCHANT_KEY: z.string().default(""),
    PAYTR_MERCHANT_SALT: z.string().default(""),
    IYZICO_API_KEY: z.string().default(""),
    IYZICO_SECRET_KEY: z.string().default(""),
    IYZICO_BASE_URL: z.url().default("https://sandbox-api.iyzipay.com"),
    IYZICO_DEFAULT_IDENTITY_NUMBER: z.string().regex(/^\d{11}$/).default("11111111111"),
    SMTP_HOST: z.string().default(""),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().default(""),
    SMTP_PASSWORD: z.string().default(""),
    SMTP_FROM: z.string().default(""),
    CRON_SECRET: z.string().default(""),
    NOINDEX: z
      .string()
      .optional()
      .transform((value) => value === "true"),
  })
  .superRefine((value, ctx) => {
    if (value.PAYMENT_PROVIDER === "mock" && value.PAYMENT_MODE === "live") {
      ctx.addIssue({
        code: "custom",
        message: "Ödeme simülatörü (mock) canlı modda kullanılamaz.",
        path: ["PAYMENT_PROVIDER"],
      });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
  throw new Error(`Ortam değişkenleri geçersiz:\n${issues}\n.env.example dosyasına bakın.`);
}

export const env = parsed.data;

export const appUrl = env.APP_URL.replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  return `${appUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export const isTestPaymentMode = env.PAYMENT_MODE === "test";
