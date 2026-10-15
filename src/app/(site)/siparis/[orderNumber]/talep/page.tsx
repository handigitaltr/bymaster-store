import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReturnRequestForm } from "@/components/order/ReturnRequestForm";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canAccessOrder } from "@/lib/order-access";
import { LEGAL_PAGE_SLUGS } from "@/lib/settings";

export const metadata: Metadata = { title: "Sorun bildir / iade talebi", robots: { index: false, follow: false } };

export default async function ReturnRequestPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  if (!/^BM[0-9A-Z]{8,14}$/.test(orderNumber)) notFound();
  const order = await db.order.findUnique({ where: { orderNumber }, include: { items: true } });
  const user = await getCurrentUser();
  if (!order || !(await canAccessOrder(order, user))) notFound();
  const returnsPage = await db.page.findFirst({ where: { slug: LEGAL_PAGE_SLUGS.returns, status: "PUBLISHED" }, select: { slug: true } });
  const allowed = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status);

  return (
    <div className="container-page max-w-2xl pb-24 pt-10">
      <p className="eyebrow">Sipariş {order.orderNumber}</p>
      <h1 className="display-md mt-2 text-cocoa-900">Sorun bildir / iade talebi</h1>
      <p className="mt-3 text-cocoa-600">
        Hasarlı, eksik veya hatalı ürün ya da iade talebiniz için formu doldurun. Talebiniz incelenerek size e-posta ile dönüş yapılır.
        {returnsPage ? (
          <>
            {" "}
            Koşullar için{" "}
            <Link href={`/sayfa/${returnsPage.slug}`} className="font-semibold text-bordeaux-600 underline">
              İade ve İptal
            </Link>{" "}
            sayfasına bakabilirsiniz.
          </>
        ) : null}
      </p>
      <div className="mt-8">
        {allowed ? (
          <ReturnRequestForm
            orderNumber={order.orderNumber}
            items={order.items.map((item) => ({ id: item.id, name: item.productName, variantName: item.variantName, quantity: item.quantity }))}
          />
        ) : (
          <p className="rounded-xl bg-cream-200 p-4 text-sm text-cocoa-700">Bu sipariş için talep oluşturulamaz.</p>
        )}
      </div>
    </div>
  );
}
