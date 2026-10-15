import { NextResponse } from "next/server";
import { quickSearch } from "@/lib/catalog";
import { rateLimit } from "@/lib/security/rate-limit";
import { getRequestIp } from "@/lib/security/request";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.slice(0, 80) ?? "";
  const limit = await rateLimit("search", getRequestIp(request));
  if (!limit.ok) return NextResponse.json({ results: [] }, { status: 429 });
  const products = query.trim().length >= 2 ? await quickSearch(query, 6) : [];
  return NextResponse.json({
    results: products.map((product) => ({
      slug: product.slug,
      name: product.name,
      subtitle: product.subtitle,
      categoryName: product.categoryName,
      imageUrl: product.image?.url ?? null,
      priceKurus: product.variant?.priceKurus ?? null,
      comingSoon: product.availability === "COMING_SOON",
    })),
  });
}
