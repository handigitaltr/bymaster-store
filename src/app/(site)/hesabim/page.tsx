import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";
import { ReorderButton } from "@/components/order/OrderClient";
import { Alert } from "@/components/ui/Alert";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/text";

export default async function AccountDashboard({ searchParams }: { searchParams: Promise<{ hosgeldin?: string }> }) {
  const user = await requireUser();
  const { hosgeldin } = await searchParams;
  const [orders, addressCount, lastReorderable] = await Promise.all([
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, orderNumber: true, status: true, totalKurus: true, createdAt: true, _count: { select: { items: true } } },
    }),
    db.address.count({ where: { userId: user.id } }),
    db.order.findFirst({
      where: { userId: user.id, status: { in: ["DELIVERED", "SHIPPED", "PAID", "PROCESSING"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, orderNumber: true, createdAt: true, items: { select: { productName: true, quantity: true }, take: 4 } },
    }),
  ]);

  return (
    <div className="space-y-8">
      {hosgeldin ? <Alert tone="success" title="Hesabınız oluşturuldu">Hoş geldiniz! Artık siparişlerinizi buradan takip edebilirsiniz.</Alert> : null}

      {lastReorderable ? (
        <section className="rounded-[1.4rem] bg-cocoa-900 p-6 text-cream-100 sm:p-8">
          <p className="eyebrow eyebrow-light">Hızlı yeniden sipariş</p>
          <p className="mt-2 font-display text-2xl text-cream-50">
            {formatDate(lastReorderable.createdAt)} tarihli siparişinizi tekrarlayın
          </p>
          <p className="mt-2 text-sm text-cream-300">
            {lastReorderable.items.map((item) => `${item.productName} × ${item.quantity}`).join(" · ")}
          </p>
          <div className="mt-5 [&_.btn]:border-cream-50/40 [&_.btn]:text-cream-50 [&_.btn:hover]:bg-cream-50 [&_.btn:hover]:text-cocoa-900">
            <ReorderButton orderId={lastReorderable.id} />
          </div>
          <p className="mt-3 text-xs text-cream-300/80">Ürünler güncel fiyat ve stok durumuyla sepetinize eklenir.</p>
        </section>
      ) : null}

      <section aria-labelledby="son-siparisler">
        <div className="flex items-end justify-between">
          <h2 id="son-siparisler" className="font-display text-2xl text-cocoa-900">
            Son siparişler
          </h2>
          <Link href="/hesabim/siparisler" className="text-sm font-bold text-cocoa-800 link-underline">
            Tümü
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="mt-4 rounded-xl bg-cream-200 p-6 text-sm text-cocoa-600">
            Henüz siparişiniz yok.{" "}
            <Link href="/urunler" className="font-bold text-bordeaux-600 underline">
              Ürünleri keşfedin
            </Link>
            .
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-cocoa-800/10 rounded-xl border border-cocoa-800/10">
            {orders.map((order) => (
              <li key={order.id}>
                <Link href={`/siparis/${order.orderNumber}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 hover:bg-cream-100">
                  <span className="font-mono text-sm font-bold text-cocoa-900">{order.orderNumber}</span>
                  <span className="text-sm text-cocoa-500">{formatDate(order.createdAt)}</span>
                  <span className="text-sm text-cocoa-500">{order._count.items} kalem</span>
                  <OrderStatusPill status={order.status} />
                  <span className="ml-auto text-sm font-bold tabular-nums">{formatTRY(order.totalKurus)}</span>
                  <ArrowRight className="size-4 text-cocoa-400" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/hesabim/adresler" className="rounded-xl border border-cocoa-800/10 p-5 hover:border-cocoa-800/30">
          <p className="font-bold text-cocoa-900">Adreslerim</p>
          <p className="mt-1 text-sm text-cocoa-500">{addressCount ? `${addressCount} kayıtlı adres` : "Henüz kayıtlı adres yok"}</p>
        </Link>
        <Link href="/hesabim/profil" className="rounded-xl border border-cocoa-800/10 p-5 hover:border-cocoa-800/30">
          <p className="font-bold text-cocoa-900">Profil ve güvenlik</p>
          <p className="mt-1 text-sm text-cocoa-500">{user.email}</p>
        </Link>
      </section>
    </div>
  );
}
