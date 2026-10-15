import type { Metadata } from "next";
import Link from "next/link";
import { OrderLookupForm } from "@/components/order/OrderLookupForm";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sipariş Takibi",
  description: "Sipariş numaranız ve e-posta adresinizle ByMaster siparişinizin durumunu ve kargo takip bilgisini görüntüleyin.",
  path: "/siparis-takip",
});

export default function OrderTrackingPage() {
  return (
    <div className="container-page grid gap-12 pb-24 pt-12 lg:grid-cols-2">
      <div>
        <p className="eyebrow">Sipariş takibi</p>
        <h1 className="display-lg mt-3 text-cocoa-900">Siparişiniz nerede?</h1>
        <p className="mt-4 max-w-md text-cocoa-600">
          Sipariş onay e-postanızdaki sipariş numarası ve siparişte kullandığınız e-posta adresiyle siparişinizin durumunu, kargo
          takip numarasını ve sipariş detaylarını görüntüleyebilirsiniz.
        </p>
        <p className="mt-6 text-sm text-cocoa-600">
          Üyeyseniz tüm siparişleriniz için{" "}
          <Link href="/hesabim" className="font-bold text-bordeaux-600 underline">
            Hesabım
          </Link>{" "}
          sayfasını kullanabilirsiniz.
        </p>
      </div>
      <div className="rounded-[1.6rem] border border-cocoa-800/10 bg-white p-6 sm:p-8">
        <OrderLookupForm />
      </div>
    </div>
  );
}
