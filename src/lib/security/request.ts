import "server-only";
import { headers } from "next/headers";
import { appUrl, env } from "@/lib/env";
import { sha256Hex } from "./crypto";

/**
 * İstemci IP'si: Next.js, başlık yoksa X-Forwarded-For değerini soket adresinden doldurur.
 * Üretimde uygulama, bu başlığı üzerine yazan bir ters vekil (nginx, Cloudflare vb.) arkasında
 * çalıştırılmalıdır; aksi halde başlık istemci tarafından taklit edilebilir. Bu nedenle kritik
 * sınırlamalar (ör. giriş denemeleri) ayrıca e-posta gibi kimlik bazlı anahtarlarla da uygulanır.
 */
function ipFromHeaderBag(get: (name: string) => string | null): string {
  const forwarded = get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = get("x-real-ip");
  if (real) return real.trim().slice(0, 64);
  return "0.0.0.0";
}

export async function getClientIp(): Promise<string> {
  const bag = await headers();
  return ipFromHeaderBag((name) => bag.get(name));
}

export function getRequestIp(request: Request): string {
  return ipFromHeaderBag((name) => request.headers.get(name));
}

export async function getUserAgent(): Promise<string | null> {
  const bag = await headers();
  return bag.get("user-agent")?.slice(0, 255) ?? null;
}

/** Kişisel veriyi azaltmak için IP adresleri tuzlanmış özet olarak saklanır */
export function hashIp(ip: string): string {
  return sha256Hex(`${env.SESSION_SECRET}:ip:${ip}`).slice(0, 32);
}

/**
 * Durum değiştiren route handler'lar için CSRF koruması: Origin başlığı sitenin kendi kökeni olmalıdır.
 * (Server Action'lar Next.js tarafından zaten Origin/Host karşılaştırmasıyla korunur.)
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    if (originUrl.origin === new URL(appUrl).origin) return true;
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return Boolean(host) && originUrl.host === host;
  } catch {
    return false;
  }
}
