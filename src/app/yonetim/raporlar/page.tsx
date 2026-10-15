import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Download } from "lucide-react";
import { AdminHeader, DownloadLink, Panel, StatCard, TableWrap, Td, Th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { PAID_STATUSES, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { cx } from "@/lib/utils";

export const metadata = { title: "Raporlar" };

const RANGES = [
  { value: "7", label: "Son 7 gün" },
  { value: "30", label: "Son 30 gün" },
  { value: "90", label: "Son 90 gün" },
  { value: "365", label: "Son 12 ay" },
] as const;

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const dayLabel = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "short" });

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

/** Son N günün İstanbul saatine göre günlük satış toplamları (satışsız günler 0) */
function dailySeries(days: number, orders: Array<{ paidAt: Date | null; totalKurus: number }>): Array<[string, number]> {
  const series = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) series.set(dayKey.format(daysAgo(i)), 0);
  for (const order of orders) {
    if (!order.paidAt) continue;
    const key = dayKey.format(order.paidAt);
    if (series.has(key)) series.set(key, (series.get(key) ?? 0) + order.totalKurus);
  }
  return Array.from(series.entries());
}

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ gun?: string }> }) {
  await requireAdmin();
  const { gun } = await searchParams;
  const days = Number(RANGES.find((r) => r.value === gun)?.value ?? "30");
  const since = daysAgo(days);
  // Satış: ödemesi alınmış, iptal/iade edilmemiş, test olmayan siparişler (ödeme tarihine göre)
  const paidWhere: Prisma.OrderWhereInput = { status: { in: PAID_STATUSES }, isTest: false, paidAt: { gte: since } };

  const [totals, paidOrders, byMethod, byBillType, byCoupon, itemGroups, created, cancelled, expired, returns, testCount] = await Promise.all([
    db.order.aggregate({ where: paidWhere, _sum: { totalKurus: true, discountKurus: true, shippingKurus: true, vatKurus: true }, _count: true }),
    db.order.findMany({ where: paidWhere, select: { paidAt: true, totalKurus: true } }),
    db.order.groupBy({ by: ["paymentMethod"], where: paidWhere, _sum: { totalKurus: true }, _count: true }),
    db.order.groupBy({ by: ["billType"], where: paidWhere, _sum: { totalKurus: true }, _count: true }),
    db.order.groupBy({ by: ["couponCode"], where: { ...paidWhere, couponCode: { not: null } }, _sum: { discountKurus: true }, _count: true }),
    db.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: paidWhere },
      _sum: { quantity: true, lineTotalKurus: true, discountKurus: true },
    }),
    db.order.count({ where: { isTest: false, createdAt: { gte: since } } }),
    db.order.count({ where: { isTest: false, createdAt: { gte: since }, status: "CANCELLED" } }),
    db.order.count({ where: { isTest: false, createdAt: { gte: since }, status: "EXPIRED" } }),
    db.returnRequest.count({ where: { createdAt: { gte: since } } }),
    db.order.count({ where: { isTest: true, createdAt: { gte: since } } }),
  ]);

  const revenue = totals._sum.totalKurus ?? 0;
  const orderCount = totals._count;
  const aov = orderCount ? Math.round(revenue / orderCount) : 0;

  const points = dailySeries(days, paidOrders);
  const maxPoint = Math.max(1, ...points.map(([, value]) => value));

  // Ürün ve kategori kırılımı
  const productIds = itemGroups.map((g) => g.productId).filter((id): id is string => Boolean(id));
  const products = productIds.length
    ? await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, primaryCategory: { select: { name: true } } } })
    : [];
  const categoryOf = new Map(products.map((p) => [p.id, p.primaryCategory?.name ?? "Kategorisiz"]));
  const productRows = itemGroups
    .map((g) => ({
      name: g.productName,
      productId: g.productId,
      quantity: g._sum.quantity ?? 0,
      net: (g._sum.lineTotalKurus ?? 0) - (g._sum.discountKurus ?? 0),
    }))
    .sort((a, b) => b.net - a.net);
  const categoryTotals = new Map<string, number>();
  for (const row of productRows) {
    const name = row.productId ? (categoryOf.get(row.productId) ?? "Kategorisiz") : "Silinmiş ürün";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + row.net);
  }
  const categoryRows = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]);
  const categorySum = Math.max(1, categoryRows.reduce((sum, [, value]) => sum + value, 0));

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Raporlar"
        description="Ödemesi alınmış siparişler (iptal edilenler ve test modundaki siparişler hariç), ödeme tarihine göre. Tutarlar KDV dahildir."
        actions={
          <DownloadLink href={`/api/yonetim/disa-aktar/siparisler?gun=${days}&test=gizle`}>
            <Download className="size-4" aria-hidden="true" /> Siparişleri CSV indir
          </DownloadLink>
        }
      />
      <nav aria-label="Tarih aralığı" className="flex flex-wrap gap-2">
        {RANGES.map((range) => (
          <Link
            key={range.value}
            href={`/yonetim/raporlar?gun=${range.value}`}
            aria-current={Number(range.value) === days ? "page" : undefined}
            className={cx("pill ring-1", Number(range.value) === days ? "bg-cocoa-900 text-cream-50 ring-cocoa-900" : "bg-white ring-cocoa-800/10 hover:bg-cream-100")}
          >
            {range.label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="dark" label="Satış (KDV dahil)" value={formatTRY(revenue)} hint={`${orderCount} sipariş`} />
        <StatCard label="Ortalama sepet" value={formatTRY(aov)} />
        <StatCard label="İndirim" value={formatTRY(totals._sum.discountKurus ?? 0)} hint="Kupon ve kampanyalar" />
        <StatCard label="Tahsil edilen kargo" value={formatTRY(totals._sum.shippingKurus ?? 0)} />
      </div>

      <Panel title="Günlük satış">
        {revenue === 0 ? (
          <p className="text-sm text-cocoa-500">Bu aralıkta ödemesi alınmış sipariş yok{testCount > 0 ? ` (${testCount} test siparişi rapora dahil edilmedi)` : ""}.</p>
        ) : (
          <>
            <div className="flex h-48 items-end gap-[2px]" role="img" aria-label={`Günlük satış grafiği; en yüksek gün ${formatTRY(maxPoint)}`}>
              {points.map(([key, value]) => (
                <div key={key} className="group relative flex h-full flex-1 items-end">
                  <div className="w-full rounded-t-sm bg-bordeaux-600/80 group-hover:bg-bordeaux-700" style={{ height: `${Math.max(value > 0 ? 2 : 0, (value / maxPoint) * 100)}%` }} />
                  <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-cocoa-900 px-2 py-1 text-xs text-cream-50 group-hover:block">
                    {dayLabel.format(new Date(`${key}T12:00:00+03:00`))}: {formatTRY(value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-cocoa-500">
              <span>{dayLabel.format(new Date(`${points[0][0]}T12:00:00+03:00`))}</span>
              <span>{dayLabel.format(new Date(`${points[points.length - 1][0]}T12:00:00+03:00`))}</span>
            </div>
          </>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <h2 className="mb-3 font-display text-xl">Ürünler</h2>
          <TableWrap>
            <thead>
              <tr>
                <Th>Ürün</Th>
                <Th className="text-right">Adet</Th>
                <Th className="text-right">Net satış</Th>
              </tr>
            </thead>
            <tbody>
              {productRows.length === 0 ? (
                <tr>
                  <Td className="text-cocoa-500">Veri yok.</Td>
                  <Td />
                  <Td />
                </tr>
              ) : null}
              {productRows.slice(0, 20).map((row) => (
                <tr key={`${row.productId}-${row.name}`}>
                  <Td>{row.name}</Td>
                  <Td className="text-right tabular-nums">{row.quantity}</Td>
                  <Td className="text-right font-semibold tabular-nums">{formatTRY(row.net)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
        <div className="space-y-6">
          <Panel title="Kategoriler">
            {categoryRows.length === 0 ? <p className="text-sm text-cocoa-500">Veri yok.</p> : null}
            <ul className="space-y-3 text-sm">
              {categoryRows.map(([name, value]) => (
                <li key={name}>
                  <div className="flex justify-between gap-3">
                    <span>{name}</span>
                    <span className="tabular-nums">{formatTRY(value)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-cream-200">
                    <div className="h-full rounded-full bg-caramel-500" style={{ width: `${(value / categorySum) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Ödeme ve müşteri">
            <dl className="space-y-2 text-sm">
              {byMethod.map((row) => (
                <div key={row.paymentMethod} className="flex justify-between gap-3">
                  <dt>{PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod}</dt>
                  <dd className="tabular-nums">
                    {row._count} · {formatTRY(row._sum.totalKurus ?? 0)}
                  </dd>
                </div>
              ))}
              {byBillType.map((row) => (
                <div key={row.billType} className="flex justify-between gap-3 border-t border-cocoa-800/8 pt-2">
                  <dt>{row.billType === "CORPORATE" ? "Kurumsal fatura" : "Bireysel fatura"}</dt>
                  <dd className="tabular-nums">
                    {row._count} · {formatTRY(row._sum.totalKurus ?? 0)}
                  </dd>
                </div>
              ))}
              {byMethod.length === 0 ? <p className="text-cocoa-500">Veri yok.</p> : null}
            </dl>
          </Panel>
          <Panel title="Sipariş akışı">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Oluşturulan sipariş</dt>
                <dd className="tabular-nums">{created}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Ödemesi tamamlanmadan süresi dolan</dt>
                <dd className="tabular-nums">{expired}</dd>
              </div>
              <div className="flex justify-between">
                <dt>İptal edilen</dt>
                <dd className="tabular-nums">{cancelled}</dd>
              </div>
              <div className="flex justify-between">
                <dt>İade / değişim talebi</dt>
                <dd className="tabular-nums">{returns}</dd>
              </div>
            </dl>
          </Panel>
          {byCoupon.length > 0 ? (
            <Panel title="Kuponlar">
              <ul className="space-y-2 text-sm">
                {byCoupon.map((row) => (
                  <li key={row.couponCode} className="flex justify-between gap-3">
                    <span className="font-mono">{row.couponCode}</span>
                    <span className="tabular-nums">
                      {row._count} kullanım · −{formatTRY(row._sum.discountKurus ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
