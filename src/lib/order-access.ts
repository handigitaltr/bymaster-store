import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { secureCookies } from "@/lib/auth/session";
import { hmacSha256, safeEqual } from "@/lib/security/crypto";

/**
 * Misafir siparişlerine erişim: imzalı, httpOnly bir çerezde erişilebilir sipariş kimlikleri tutulur.
 * Sipariş bağlantılarında gizli anahtar taşınmaz (URL sızıntısı riski yok).
 */
const COOKIE = "bm_orders";
const MAX_ORDERS = 12;
const TTL_SECONDS = 60 * 60 * 24 * 30;

type Payload = { ids: string[]; exp: number };

function sign(data: string) {
  return hmacSha256(env.SESSION_SECRET, `order-access:${data}`, "base64").replace(/=+$/, "");
}

function decode(value: string | undefined): Payload | null {
  if (!value) return null;
  const [data, signature] = value.split(".");
  if (!data || !signature || !safeEqual(sign(data), signature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as Payload;
    if (!Array.isArray(payload.ids) || typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAccessibleOrderIds(): Promise<string[]> {
  const store = await cookies();
  return decode(store.get(COOKIE)?.value)?.ids ?? [];
}

/** Yalnızca Server Action / route handler içinde çağrılabilir */
export async function grantOrderAccess(orderId: string) {
  const store = await cookies();
  const current = decode(store.get(COOKIE)?.value)?.ids ?? [];
  const ids = [orderId, ...current.filter((id) => id !== orderId)].slice(0, MAX_ORDERS);
  const data = Buffer.from(JSON.stringify({ ids, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })).toString(
    "base64url",
  );
  store.set(COOKIE, `${data}.${sign(data)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function canAccessOrder(order: { id: string; userId: string | null }, user: { id: string; role: string } | null) {
  if (user && (user.role === "ADMIN" || order.userId === user.id)) return true;
  const ids = await getAccessibleOrderIds();
  return ids.includes(order.id);
}
