import fs from "node:fs/promises";
import { resolveStoragePath } from "@/lib/uploads";

export const dynamic = "force-dynamic";

/** Yönetim panelinden yüklenen görseller (public dışında saklanır, yalnızca doğrulanmış yollar sunulur) */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const file = resolveStoragePath(path.join("/"));
  if (!file) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(file);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
