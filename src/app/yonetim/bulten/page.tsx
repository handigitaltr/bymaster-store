import { Download } from "lucide-react";
import { AdminHeader, DownloadLink, Badge, EmptyRow, Pager, TableWrap, Td, Th, pageParam } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/text";

export const metadata = { title: "Bülten aboneleri" };

export default async function AdminNewsletterPage({ searchParams }: { searchParams: Promise<{ sayfa?: string }> }) {
  await requireAdmin();
  const page = pageParam((await searchParams).sayfa);
  const [subscribers, total, active] = await Promise.all([
    db.newsletterSubscription.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50 }),
    db.newsletterSubscription.count(),
    db.newsletterSubscription.count({ where: { status: "ACTIVE" } }),
  ]);
  return (
    <div>
      <AdminHeader
        title="Bülten aboneleri"
        description={`${active} aktif abone · toplam ${total} kayıt. Ticari ileti göndermeden önce İYS (İleti Yönetim Sistemi) kaydınızı ve onay kayıtlarını kontrol edin.`}
        actions={
          <DownloadLink href="/api/yonetim/disa-aktar/bulten">
            <Download className="size-4" aria-hidden="true" /> Aktif aboneler (CSV)
          </DownloadLink>
        }
      />
      <TableWrap>
        <thead>
          <tr>
            <Th>E-posta</Th>
            <Th>Durum</Th>
            <Th>Kaynak</Th>
            <Th>Onay tarihi</Th>
          </tr>
        </thead>
        <tbody>
          {subscribers.length === 0 ? <EmptyRow colSpan={4}>Abone yok.</EmptyRow> : null}
          {subscribers.map((subscriber) => (
            <tr key={subscriber.id}>
              <Td>{subscriber.email}</Td>
              <Td>{subscriber.status === "ACTIVE" ? <Badge tone="success">Aktif</Badge> : <Badge>Ayrıldı</Badge>}</Td>
              <Td className="text-cocoa-600">{subscriber.source ?? "—"}</Td>
              <Td className="text-xs text-cocoa-500">{formatDateTime(subscriber.createdAt)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <Pager page={page} pages={Math.ceil(total / 50)} buildHref={(p) => `/yonetim/bulten?sayfa=${p}`} />
    </div>
  );
}
