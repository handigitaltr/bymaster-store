import Image from "next/image";
import { deleteMediaAction } from "@/app/actions/admin/media";
import { ConfirmButton } from "@/components/admin/AdminForm";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { AdminHeader, Badge, Pager, pageParam } from "@/components/admin/ui";
import { CopyButton } from "@/components/order/OrderClient";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/text";

export const metadata = { title: "Medya" };

const PAGE_SIZE = 36;

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ sayfa?: string }> }) {
  await requireAdmin();
  const page = pageParam((await searchParams).sayfa);
  const [assets, total] = await Promise.all([
    db.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.mediaAsset.count(),
  ]);
  const urls = assets.map((a) => a.url);
  const [productUse, categoryUse, postUse, orderUse] = await Promise.all([
    db.productImage.findMany({ where: { url: { in: urls } }, select: { url: true } }),
    db.category.findMany({ where: { imageUrl: { in: urls } }, select: { imageUrl: true } }),
    db.blogPost.findMany({ where: { coverImageUrl: { in: urls } }, select: { coverImageUrl: true } }),
    db.orderItem.findMany({ where: { imageUrl: { in: urls } }, select: { imageUrl: true }, distinct: ["imageUrl"] }),
  ]);
  const used = new Set<string>([
    ...productUse.map((u) => u.url),
    ...categoryUse.map((u) => u.imageUrl ?? ""),
    ...postUse.map((u) => u.coverImageUrl ?? ""),
    ...orderUse.map((u) => u.imageUrl ?? ""),
  ]);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Medya"
        description={`${total} yüklenmiş görsel. Yüklenen her dosya sunucuda doğrulanır, WebP'ye dönüştürülür ve konum/kamera meta verileri temizlenir. Ürün görselleri ürün düzenleme ekranından da yüklenebilir.`}
      />
      <MediaUploader />
      {assets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-cocoa-800/20 p-12 text-center text-sm text-cocoa-500">Henüz yüklenmiş görsel yok.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {assets.map((asset) => (
            <li key={asset.id} className="overflow-hidden rounded-2xl border border-cocoa-800/10 bg-white">
              <div className="relative aspect-square bg-cream-100">
                <Image src={asset.url} alt={asset.alt ?? ""} fill sizes="240px" className="object-contain" />
              </div>
              <div className="space-y-2 p-3 text-xs">
                <p className="truncate font-semibold" title={asset.originalName}>
                  {asset.originalName}
                </p>
                <p className="text-cocoa-500">
                  {asset.width}×{asset.height} · {Math.round(asset.sizeBytes / 1024)} KB · {formatDate(asset.createdAt)}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <CopyButton value={asset.url} label="Görsel yolu" />
                  {used.has(asset.url) ? (
                    <Badge tone="success">Kullanımda</Badge>
                  ) : (
                    <ConfirmButton action={deleteMediaAction} fields={{ id: asset.id }} label="Sil" confirmText="Görsel kalıcı olarak silinecek. Emin misiniz?" className="text-xs font-bold text-bordeaux-600 hover:underline" />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} pages={Math.ceil(total / PAGE_SIZE)} buildHref={(p) => `/yonetim/medya?sayfa=${p}`} />
    </div>
  );
}
