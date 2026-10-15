import type { Metadata } from "next";
import { FavoritesList } from "@/components/product/StoredProductLists";

export const metadata: Metadata = { title: "Favorilerim", robots: { index: false, follow: true } };

export default function FavoritesPage() {
  return (
    <div className="container-page pb-24 pt-12">
      <p className="eyebrow">Favoriler</p>
      <h1 className="display-lg mt-3 text-cocoa-900">Favorilerim</h1>
      <p className="mt-3 max-w-xl text-sm text-cocoa-500">Favori listeniz yalnızca bu tarayıcıda saklanır.</p>
      <div className="mt-10">
        <FavoritesList />
      </div>
    </div>
  );
}
