import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Download } from "lucide-react";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";
import { AdminHeader, DownloadLink, Badge, EmptyRow, Pager, SearchBar, TableWrap, Td, Th, pageParam } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { ORDER_STATUS_LABELS, ORDER_STATUSES, PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { expireStaleOrders } from "@/lib/orders";
import { formatDateTime } from "@/lib/text";

type Props = { searchParams: Promise<{ q?: string; durum?: string; sayfa?: string; test?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin();
  await expireStaleOrders(true);
  const { q, durum, sayfa, test } = await searchParams;
  const page = pageParam(sayfa);
  const pageSize = 25;
  const where: Prisma.OrderWhereInput = {
    ...(durum && (ORDER_STATUSES as readonly string[]).includes(durum) ? { status: durum } : {}),
    ...(test === "gizle" ? { isTest: false } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q.toUpperCase() } },
            { email: { contains: q.toLowerCase() } },
            { customerName: { contains: q } },
            { phone: { contains: q.replace(/\D/g, "") || q } },
          ],
        }
      : {}),
  };
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, orderNumber: true, customerName: true, email: true, totalKurus: true, status: true, paymentMethod: true, paymentStatus: true, isTest: true, createdAt: true, _count: { select: { items: true } } },
    }),
    db.order.count({ where }),
  ]);
  const query = (p: number) => `/yonetim/siparisler?${new URLSearchParams({ ...(q ? { q } : {}), ...(durum ? { durum } : {}), ...(test ? { test } : {}), sayfa: String(p) })}`;

  return (
    <div>
      <AdminHeader
        title="Siparişler"
        description={`${total} sipariş`}
        actions={
          <DownloadLink href={`/api/yonetim/disa-aktar/siparisler?${new URLSearchParams({ ...(q ? { q } : {}), ...(durum ? { durum } : {}), ...(test ? { test } : {}) })}`}>
            <Download className="size-4" aria-hidden="true" /> CSV dışa aktar
          </DownloadLink>
        }
      />
      <SearchBar action="/yonetim/siparisler" defaultValue={q} placeholder="Sipariş no, e-posta, ad veya telefon">
        <select name="durum" defaultValue={durum ?? ""} className="field-input !min-h-10 !w-auto !py-1.5 text-sm" aria-label="Durum">
          <option value="">Tüm durumlar</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <select name="test" defaultValue={test ?? ""} className="field-input !min-h-10 !w-auto !py-1.5 text-sm" aria-label="Test siparişleri">
          <option value="">Test siparişleri dahil</option>
          <option value="gizle">Test siparişlerini gizle</option>
        </select>
      </SearchBar>
      <TableWrap>
        <thead>
          <tr>
            <Th>Sipariş</Th>
            <Th>Müşteri</Th>
            <Th>Tarih</Th>
            <Th>Ödeme</Th>
            <Th>Durum</Th>
            <Th className="text-right">Tutar</Th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? <EmptyRow colSpan={6}>Sipariş bulunamadı.</EmptyRow> : null}
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-cream-100/60">
              <Td>
                <Link href={`/yonetim/siparisler/${order.id}`} className="font-mono font-bold text-cocoa-900 hover:underline">
                  {order.orderNumber}
                </Link>
                {order.isTest ? <span className="ml-2"><Badge tone="danger">Test</Badge></span> : null}
                <span className="block text-xs text-cocoa-500">{order._count.items} kalem</span>
              </Td>
              <Td>
                <span className="block font-semibold">{order.customerName}</span>
                <span className="block text-xs text-cocoa-500">{order.email}</span>
              </Td>
              <Td className="whitespace-nowrap text-cocoa-600">{formatDateTime(order.createdAt)}</Td>
              <Td className="text-cocoa-600">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Td>
              <Td>
                <OrderStatusPill status={order.status} />
              </Td>
              <Td className="text-right font-bold tabular-nums">{formatTRY(order.totalKurus)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <Pager page={page} pages={Math.ceil(total / pageSize)} buildHref={query} />
    </div>
  );
}
