import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AdminHeader, Badge, EmptyRow, Pager, SearchBar, TableWrap, Td, Th, pageParam } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/text";
import { cx } from "@/lib/utils";

export const metadata = { title: "İşlem kayıtları" };

const PAGE_SIZE = 50;

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ q?: string; sayfa?: string; tur?: string }> }) {
  await requireAdmin();
  const { q, sayfa, tur } = await searchParams;
  const page = pageParam(sayfa);
  const tab = tur === "eposta" ? "eposta" : "islem";

  const tabs = (
    <nav aria-label="Kayıt türü" className="mb-5 flex gap-2">
      {[
        { key: "islem", label: "Yönetim işlemleri", href: "/yonetim/denetim" },
        { key: "eposta", label: "E-posta gönderimleri", href: "/yonetim/denetim?tur=eposta" },
      ].map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={tab === item.key ? "page" : undefined}
          className={cx("pill ring-1", tab === item.key ? "bg-cocoa-900 text-cream-50 ring-cocoa-900" : "bg-white ring-cocoa-800/10 hover:bg-cream-100")}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  if (tab === "eposta") {
    const where: Prisma.EmailLogWhereInput = q ? { OR: [{ to: { contains: q.toLowerCase() } }, { subject: { contains: q } }] } : {};
    const [logs, total] = await Promise.all([
      db.emailLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      db.emailLog.count({ where }),
    ]);
    return (
      <div>
        <AdminHeader title="İşlem kayıtları" description="Gönderilen, başarısız olan ve SMTP yapılandırılmadığı için atlanan e-postalar." />
        {tabs}
        <SearchBar action="/yonetim/denetim" defaultValue={q} placeholder="Alıcı veya konu">
          <input type="hidden" name="tur" value="eposta" />
        </SearchBar>
        <TableWrap>
          <thead>
            <tr>
              <Th>Tarih</Th>
              <Th>Alıcı</Th>
              <Th>Konu</Th>
              <Th>Durum</Th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? <EmptyRow colSpan={4}>Kayıt yok.</EmptyRow> : null}
            {logs.map((log) => (
              <tr key={log.id}>
                <Td className="whitespace-nowrap text-xs text-cocoa-500">{formatDateTime(log.createdAt)}</Td>
                <Td>{log.to}</Td>
                <Td>
                  {log.subject}
                  <span className="block text-xs text-cocoa-500">{log.template}</span>
                </Td>
                <Td>
                  {log.status === "SENT" ? <Badge tone="success">Gönderildi</Badge> : log.status === "FAILED" ? <Badge tone="danger">Başarısız</Badge> : <Badge tone="warning">Atlandı</Badge>}
                  {log.error ? <span className="mt-1 block max-w-xs truncate text-xs text-bordeaux-600" title={log.error}>{log.error}</span> : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <Pager page={page} pages={Math.ceil(total / PAGE_SIZE)} buildHref={(p) => `/yonetim/denetim?${new URLSearchParams({ tur: "eposta", ...(q ? { q } : {}), sayfa: String(p) })}`} />
      </div>
    );
  }

  const where: Prisma.AuditLogWhereInput = q ? { OR: [{ action: { contains: q } }, { summary: { contains: q } }, { entityType: { contains: q } }] } : {};
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true, email: true } } },
    }),
    db.auditLog.count({ where }),
  ]);
  return (
    <div>
      <AdminHeader title="İşlem kayıtları" description="Yönetim panelinde yapılan değişiklikler ve ödeme/sipariş sistem olayları. Kayıtlar panelden silinemez." />
      {tabs}
      <SearchBar action="/yonetim/denetim" defaultValue={q} placeholder="İşlem, kayıt türü veya özet" />
      <TableWrap>
        <thead>
          <tr>
            <Th>Tarih</Th>
            <Th>Kullanıcı</Th>
            <Th>İşlem</Th>
            <Th>Kayıt</Th>
            <Th>Özet</Th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? <EmptyRow colSpan={5}>Kayıt yok.</EmptyRow> : null}
          {logs.map((log) => (
            <tr key={log.id}>
              <Td className="whitespace-nowrap text-xs text-cocoa-500">{formatDateTime(log.createdAt)}</Td>
              <Td>{log.actor ? log.actor.name : <span className="text-cocoa-500">Sistem</span>}</Td>
              <Td className="font-mono text-xs">{log.action}</Td>
              <Td className="text-xs text-cocoa-600">{log.entityType}</Td>
              <Td className="max-w-md text-xs text-cocoa-600">{log.summary ?? "—"}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <Pager page={page} pages={Math.ceil(total / PAGE_SIZE)} buildHref={(p) => `/yonetim/denetim?${new URLSearchParams({ ...(q ? { q } : {}), sayfa: String(p) })}`} />
    </div>
  );
}
