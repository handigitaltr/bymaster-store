import type { Metadata } from "next";
import { CompareTable } from "@/components/product/StoredProductLists";

export const metadata: Metadata = { title: "Ürün karşılaştırma", robots: { index: false, follow: true } };

export default function ComparePage() {
  return (
    <div className="container-page pb-24 pt-12">
      <p className="eyebrow">Karşılaştırma</p>
      <h1 className="display-lg mt-3 text-cocoa-900">Ürünleri karşılaştırın</h1>
      <p className="mt-3 max-w-xl text-sm text-cocoa-500">Ambalaj, net miktar, fiyat ve kilogram fiyatlarını yan yana görün.</p>
      <div className="mt-10">
        <CompareTable />
      </div>
    </div>
  );
}
