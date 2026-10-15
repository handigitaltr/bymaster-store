// Kriptografik yardımcılar (yalnızca sunucu tarafında kullanılır; saf Node.js crypto)
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hmacSha256(key: string, value: string, encoding: "hex" | "base64" = "hex"): string {
  return createHmac("sha256", key).update(value).digest(encoding);
}

/** Zamanlama saldırılarına karşı sabit süreli karşılaştırma */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Uzunluk farkını da sabit sürede işle
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

const READABLE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Karıştırılması zor karakterlerden oluşan kısa kod (sipariş / referans numaraları) */
export function readableCode(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += READABLE_ALPHABET[bytes[i] % READABLE_ALPHABET.length];
  return out;
}
