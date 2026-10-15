import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { expireStaleOrders } from "@/lib/orders";
import { safeEqual } from "@/lib/security/crypto";

export const dynamic = "force-dynamic";

/**
 * Zamanlanmış görev: ödeme süresi dolan siparişleri kapatır ve ayrılan stoğu serbest bırakır.
 * Yalnızca CRON_SECRET tanımlıysa ve "Authorization: Bearer <CRON_SECRET>" başlığı doğruysa çalışır.
 * (Aynı temizlik ödeme, sipariş ve yönetim sayfalarında da kendiliğinden yapılır.)
 */
async function handle(request: Request) {
  if (!env.CRON_SECRET) return new NextResponse("Not found", { status: 404 });
  const authorization = request.headers.get("authorization") ?? "";
  if (!safeEqual(authorization, `Bearer ${env.CRON_SECRET}`)) return new NextResponse("Unauthorized", { status: 401 });
  const expired = await expireStaleOrders(true);
  return NextResponse.json({ ok: true, expired });
}

export const GET = handle;
export const POST = handle;
