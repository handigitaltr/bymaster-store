import Link from "next/link";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/text";

export default async function AccountOrdersPage({ searchParams }: { searchParams: Promise<{ sayfa?: string }> }) {
  const user = await requireUser("/hesabim/siparisler");
  const { sayfa } = await searchParams;
  const page = Math.max(1, Math.min(100, Number.parseInt(sayfa ?? "1", 10) || 1));
  const pageSize = 10;
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { items: { select: { productName: true, quantity: true }, take: 3 } },
    }),
    db.order.count({ where: { userId: user.id } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h2 className="font-display text-2xl text-cocoa-900">Siparişlerim</h2>
      {orders.length === 0 ? (
        <p className="mt-4 rounded-xl bg-cream-200 p-6 text-sm text-cocoa-600">Henüz siparişiniz yok.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/siparis/${order.orderNumber}`} className="block rounded-xl border border-cocoa-800/10 p-5 transition hover:border-cocoa-800/30">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <span className="font-mono text-sm font-bold text-cocoa-900">{order.orderNumber}</span>
                  <span className="text-sm text-cocoa-500">{formatDate(order.createdAt)}</span>
                  <OrderStatusPill status={order.status} />
                  <span className="ml-auto font-bold tabular-nums">{formatTRY(order.totalKurus)}</span>
                </div>
                <p className="mt-2 text-sm text-cocoa-600">{order.items.map((item) => `${item.productName} × ${item.quantity}`).join(" · ")}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 ? (
        <nav className="mt-6 flex items-center gap-2" aria-label="Sayfalar">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/hesabim/siparisler?sayfa=${n}`}
              aria-current={n === page ? "page" : undefined}
              className={`grid size-9 place-content-center rounded-full text-sm font-bold ${n === page ? "bg-cocoa-800 text-cream-50" : "text-cocoa-700 hover:bg-cream-200"}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
