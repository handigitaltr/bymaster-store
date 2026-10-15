"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { assertAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { deleteStoredFile } from "@/lib/uploads";
import { z } from "@/lib/validation";

/** Görselin kullanıldığı yerler (ürün, kategori, blog kapağı, geçmiş sipariş kalemleri). Dışa aktarılmaz: "use server" dosyasındaki her export istemciden çağrılabilir. */
async function mediaUsage(url: string) {
  const [products, categories, posts, orderItems] = await Promise.all([
    db.productImage.count({ where: { url } }),
    db.category.count({ where: { imageUrl: url } }),
    db.blogPost.count({ where: { coverImageUrl: url } }),
    db.orderItem.count({ where: { imageUrl: url } }),
  ]);
  return { products, categories, posts, orderItems, total: products + categories + posts + orderItems };
}

export async function deleteMediaAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const id = z.string().min(10).max(40).parse(formData.get("id"));
  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset) return;
  const usage = await mediaUsage(asset.url);
  if (usage.total > 0) throw new Error("Görsel kullanımda olduğu için silinemez.");
  await db.mediaAsset.delete({ where: { id } });
  await deleteStoredFile(asset.storageKey);
  await audit(admin.id, "media.delete", "MediaAsset", id, asset.originalName);
  revalidatePath("/yonetim/medya");
}
