import "server-only";
import { revalidatePath } from "next/cache";

/** Vitrindeki önbelleğe alınmış tüm sayfaları yeniler (katalog/ayar/içerik değişikliklerinden sonra) */
export function revalidateStorefront() {
  revalidatePath("/", "layout");
}

/** Stok değişen ürün sayfalarını yeniler */
export function revalidateProducts(slugs: string[]) {
  for (const slug of new Set(slugs)) revalidatePath(`/urun/${slug}`);
  revalidatePath("/");
}
