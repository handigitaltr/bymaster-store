import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getSession } from "./session";

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  return session?.user ?? null;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Sayfalar için: giriş yoksa giriş sayfasına yönlendirir */
export async function requireUser(nextPath = "/hesabim"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/giris?sonra=${encodeURIComponent(nextPath)}`);
  return user;
}

/**
 * Yönetim sayfaları için: giriş yoksa giriş sayfasına, yetkisiz kullanıcıyı 404'e yönlendirir.
 * Asıl yetki kontrolü her sunucu işleminde (assertAdmin) ayrıca yapılır.
 */
export async function requireAdmin(nextPath = "/yonetim"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/giris?sonra=${encodeURIComponent(nextPath)}`);
  if (user.role !== "ADMIN") notFound();
  return user;
}

export class AuthorizationError extends Error {
  constructor() {
    super("Bu işlem için yetkiniz yok.");
    this.name = "AuthorizationError";
  }
}

/** Server Action ve route handler'lar için: yönetici değilse hata fırlatır */
export async function assertAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new AuthorizationError();
  return user;
}
