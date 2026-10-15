import Link from "next/link";
import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";
import { AdminHeader, Badge, Panel, StatCard } from "@/components/admin/ui";
import { getDashboardStats, getGoLiveChecklist } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth/guards";
import { formatTRY } from "@/lib/money";
import { expireStaleOrders } from "@/lib/orders";
import { formatDateTime } from "@/lib/text";

export default async function AdminDashboard() {
  await requireAdmin();
  await expireStaleOrders(true);
  const [stats, checklist] = await Promise.all([getDashboardStats(), getGoLiveChecklist()]);
  const todo = checklist.filter((item) => item.status === "todo").length;

  return (
    <div className="space-y-8">
      <AdminHeader title="Panel" description="Satış özeti, bekleyen işler ve yayına hazırlık durumu. Test siparişleri ciroya dahil edilmez." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="dark" label="Son 30 gün ciro" value={formatTRY(stats.revenue30)} hint={`${stats.orders30} ödenmiş sipariş`} />
        <StatCard label="Son 7 gün ciro" value={formatTRY(stats.revenue7)} hint={`${stats.orders7} ödenmiş sipariş`} />
        <StatCard label="Ortalama sepet (30 gün)" value={stats.orders30 ? formatTRY(Math.round(stats.revenue30 / stats.orders30)) : "—"} />
        <StatCard
          label="Bekleyen işlem"
          value={stats.toShip + stats.awaitingTransfer}
          hint={`${stats.toShip} hazırlanacak · ${stats.awaitingTransfer} havale bekliyor · ${stats.pendingPayment} kart ödemesi bekliyor`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title="Yayına hazırlık" className="xl:col-span-3" actions={todo ? <Badge tone="warning">{todo} eksik</Badge> : <Badge tone="success">Hazır</Badge>}>
          <ul className="divide-y divide-cocoa-800/8">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="flex items-start gap-3 py-3 hover:bg-cream-100/60">
                  {item.status === "ok" ? (
                    <CheckCircle2 className="mt-0.5 size-5 flex-none text-success" aria-label="Tamam" />
                  ) : item.status === "warn" ? (
                    <AlertTriangle className="mt-0.5 size-5 flex-none text-warning" aria-label="Uyarı" />
                  ) : (
                    <Circle className="mt-0.5 size-5 flex-none text-bordeaux-500" aria-label="Yapılacak" />
                  )}
                  <span>
                    <span className="block text-sm font-bold text-cocoa-900">{item.label}</span>
                    <span className="block text-xs text-cocoa-500">{item.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6 xl:col-span-2">
          <Panel title="Kritik stok" actions={<Link href="/yonetim/stok" className="text-xs font-bold text-bordeaux-600">Stok yönetimi</Link>}>
            {stats.lowStock.length === 0 ? (
              <p className="text-sm text-cocoa-500">Stok takibi açık ürünlerde kritik seviyede ürün yok.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.lowStock.map((variant) => (
                  <li key={variant.id} className="flex justify-between gap-3">
                    <Link href={`/yonetim/urunler/${variant.product.id}`} className="truncate hover:underline">
                      {variant.product.name} · {variant.name}
                    </Link>
                    <Badge tone={variant.stock <= 0 ? "danger" : "warning"}>{variant.stock}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Son siparişler" actions={<Link href="/yonetim/siparisler" className="text-xs font-bold text-bordeaux-600">Tümü</Link>}>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-cocoa-500">Henüz sipariş yok.</p>
            ) : (
              <ul className="divide-y divide-cocoa-800/8 text-sm">
                {stats.recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link href={`/yonetim/siparisler/${order.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 hover:bg-cream-100/60">
                      <span className="font-mono font-bold">{order.orderNumber}</span>
                      {order.isTest ? <Badge tone="danger">Test</Badge> : null}
                      <OrderStatusPill status={order.status} />
                      <span className="ml-auto font-bold tabular-nums">{formatTRY(order.totalKurus)}</span>
                      <span className="w-full text-xs text-cocoa-500">
                        {order.customerName} · {formatDateTime(order.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
