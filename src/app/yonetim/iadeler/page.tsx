import Link from "next/link";
import { AdminHeader, Badge, EmptyRow, TableWrap, Td, Th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { RETURN_REASON_LABELS, RETURN_STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/text";

export const metadata = { title: "İade talepleri" };

export default async function AdminReturnsPage() {
  await requireAdmin();
  const requests = await db.returnRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { order: { select: { orderNumber: true, id: true } } },
  });
  return (
    <div>
      <AdminHeader title="İade ve sorun talepleri" description="Müşterilerin sipariş sayfasından ilettiği talepler." />
      <TableWrap>
        <thead>
          <tr>
            <Th>Referans</Th>
            <Th>Sipariş</Th>
            <Th>Neden</Th>
            <Th>Durum</Th>
            <Th>Tarih</Th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? <EmptyRow colSpan={5}>Talep yok.</EmptyRow> : null}
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-cream-100/60">
              <Td>
                <Link href={`/yonetim/iadeler/${request.id}`} className="font-mono font-bold hover:underline">
                  {request.referenceNo}
                </Link>
              </Td>
              <Td>
                <Link href={`/yonetim/siparisler/${request.order.id}`} className="font-mono hover:underline">
                  {request.order.orderNumber}
                </Link>
              </Td>
              <Td>{RETURN_REASON_LABELS[request.reason]}</Td>
              <Td>
                <Badge tone={request.status === "REQUESTED" ? "warning" : request.status === "REJECTED" ? "danger" : "neutral"}>{RETURN_STATUS_LABELS[request.status]}</Badge>
              </Td>
              <Td className="text-xs text-cocoa-500">{formatDateTime(request.createdAt)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}
