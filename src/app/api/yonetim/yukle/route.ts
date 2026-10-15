import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/security/rate-limit";
import { getRequestIp, isSameOriginRequest } from "@/lib/security/request";
import { MAX_UPLOAD_BYTES, UploadError, saveImageUpload } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Geçersiz kaynak" }, { status: 403 });
  const limit = await rateLimit("upload", `${user.id}:${getRequestIp(request)}`);
  if (!limit.ok) return NextResponse.json({ error: "Çok fazla yükleme. Biraz sonra tekrar deneyin." }, { status: 429 });

  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) return NextResponse.json({ error: "Dosya 5 MB'tan büyük olamaz." }, { status: 413 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  const alt = typeof form.get("alt") === "string" ? String(form.get("alt")) : null;

  try {
    const { asset, fit } = await saveImageUpload(file, { uploadedById: user.id, alt });
    await audit(user.id, "media.upload", "MediaAsset", asset.id, asset.originalName);
    return NextResponse.json({ asset: { id: asset.id, url: asset.url, width: asset.width, height: asset.height, alt: asset.alt }, fit });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("[yükleme] hata", error);
    return NextResponse.json({ error: "Yükleme başarısız." }, { status: 500 });
  }
}
