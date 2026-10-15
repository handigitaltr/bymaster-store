import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { randomToken, sha256Hex } from "@/lib/security/crypto";

export const SESSION_COOKIE = "bm_session";
const CUSTOMER_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const ADMIN_TTL_MS = 12 * 60 * 60 * 1000;

export const secureCookies = appUrl.startsWith("https://");

export async function createSession(userId: string, role: string, userAgent?: string | null) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + (role === "ADMIN" ? ADMIN_TTL_MS : CUSTOMER_TTL_MS));
  await db.session.create({
    data: { id: sha256Hex(token), userId, expiresAt, userAgent: userAgent?.slice(0, 255) ?? null },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    path: "/",
    expires: expiresAt,
  });
}

async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || token.length < 20 || token.length > 100) return null;
  return token;
}

/** İstek başına bir kez çalışır (React cache) */
export const getSession = cache(async () => {
  const token = await readSessionToken();
  if (!token) return null;
  const session = await db.session.findUnique({ where: { id: sha256Hex(token) }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now() || !session.user.isActive) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session;
});

export async function destroyCurrentSession() {
  const token = await readSessionToken();
  if (token) await db.session.deleteMany({ where: { id: sha256Hex(token) } });
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function destroyOtherSessions(userId: string) {
  const token = await readSessionToken();
  const currentId = token ? sha256Hex(token) : undefined;
  await db.session.deleteMany({ where: { userId, ...(currentId ? { id: { not: currentId } } : {}) } });
}

export async function purgeExpiredSessions() {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
