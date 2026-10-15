import "server-only";
import { db } from "@/lib/db";

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

export const RATE_LIMITS = {
  loginIp: { limit: 20, windowSeconds: 15 * 60 },
  loginEmail: { limit: 8, windowSeconds: 15 * 60 },
  register: { limit: 6, windowSeconds: 60 * 60 },
  passwordReset: { limit: 5, windowSeconds: 60 * 60 },
  quote: { limit: 6, windowSeconds: 60 * 60 },
  contact: { limit: 6, windowSeconds: 60 * 60 },
  newsletter: { limit: 10, windowSeconds: 60 * 60 },
  checkout: { limit: 12, windowSeconds: 10 * 60 },
  cart: { limit: 150, windowSeconds: 60 },
  coupon: { limit: 15, windowSeconds: 10 * 60 },
  search: { limit: 120, windowSeconds: 60 },
  stockNotify: { limit: 10, windowSeconds: 60 * 60 },
  orderLookup: { limit: 10, windowSeconds: 15 * 60 },
  returnRequest: { limit: 5, windowSeconds: 24 * 60 * 60 },
  upload: { limit: 60, windowSeconds: 10 * 60 },
  paymentStart: { limit: 20, windowSeconds: 10 * 60 },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

/**
 * Veritabanı tabanlı sabit pencereli hız sınırlayıcı.
 * Birden çok sunucu örneği aynı veritabanını kullandığında da tutarlı çalışır.
 */
export async function rateLimit(name: RateLimitName, identifier: string): Promise<RateLimitResult> {
  const { limit, windowSeconds } = RATE_LIMITS[name];
  const key = `${name}:${identifier}`.slice(0, 200);
  const now = new Date();
  const windowStartCutoff = new Date(now.getTime() - windowSeconds * 1000);

  const result = await db.$transaction(async (tx) => {
    const row = await tx.rateLimit.findUnique({ where: { key } });
    if (!row || row.windowStart < windowStartCutoff) {
      await tx.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStart: now },
        update: { count: 1, windowStart: now },
      });
      return { ok: true, retryAfterSeconds: 0 };
    }
    if (row.count >= limit) {
      const retry = Math.ceil((row.windowStart.getTime() + windowSeconds * 1000 - now.getTime()) / 1000);
      return { ok: false, retryAfterSeconds: Math.max(1, retry) };
    }
    await tx.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return { ok: true, retryAfterSeconds: 0 };
  });

  // Eski kayıtları ara ara temizle
  if (Math.random() < 0.01) {
    void db.rateLimit
      .deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } })
      .catch(() => undefined);
  }

  return result;
}

export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return minutes <= 1
    ? "Çok fazla deneme yaptınız. Lütfen bir dakika sonra tekrar deneyin."
    : `Çok fazla deneme yaptınız. Lütfen ${minutes} dakika sonra tekrar deneyin.`;
}
