import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/catalog";
import { rateLimit } from "@/lib/security/rate-limit";
import { getRequestIp } from "@/lib/security/request";

export const dynamic = "force-dynamic";

/** Favori ve karşılaştırma listeleri için ürün özetleri (yalnızca yayındaki ürünler) */
export async function GET(request: Request) {
  const limit = await rateLimit("search", getRequestIp(request));
  if (!limit.ok) return NextResponse.json({ products: [] }, { status: 429 });
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^[a-z0-9]{10,40}$/i.test(id))
    .slice(0, 50);
  const products = await getProductsByIds(ids);
  return NextResponse.json({ products }, { headers: { "Cache-Control": "no-store" } });
}
