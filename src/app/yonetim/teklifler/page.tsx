import Link from "next/link";
import { Download } from "lucide-react";
import { AdminHeader, DownloadLink, Badge, EmptyRow, Pager, SearchBar, TableWrap, Td, Th, pageParam } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { QUOTE_STATUS_LABELS, QUOTE_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/text";

export const metadata = { title: "B2B teklifler" };

export default async function AdminQuotesPage({ searchParams }: { searchParams: Promise<{ q?: string; durum?: string; sayfa?: string }> }) {
  await requireAdmin();
  const { q, durum, sayfa } = await searchParams;
  const page = pageParam(sayfa);
  const where = {
    ...(durum && (QUOTE_STATUSES as readonly string[]).includes(durum) ? { status: durum } : {}),
    ...(q ? { OR: [{ companyName: { contains: q } }, { email: { contains: q.toLowerCase() } }, { referenceNo: { contains: q.toUpperCase() } }] } : {}),
  };
  const [quotes, total] = await Promise.all([
    db.quoteRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25, include: { _count: { select: { items: true } } } }),
    db.quoteRequest.count({ where }),
  ]);
  return (
    <div>
      <AdminHeader
        title="B2B teklif talepleri"
        description={`${total} talep`}
        actions={
          <DownloadLink href="/api/yonetim/disa-aktar/teklifler">
            <Download className="size-4" aria-hidden="true" /> CSV
          </DownloadLink>
        }
      />
      <SearchBar action="/yonetim/teklifler" defaultValue={q} placeholder="İşletme, e-posta veya referans">
        <select name="durum" defaultValue={durum ?? ""} className="field-input !min-h-10 !w-auto !py-1.5 text-sm" aria-label="Durum">
          <option value="">Tüm durumlar</option>
          {QUOTE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {QUOTE_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </SearchBar>
      <TableWrap>
        <thead>
          <tr>
            <Th>Referans</Th>
            <Th>İşletme</Th>
            <Th>İletişim</Th>
            <Th>Kalem</Th>
            <Th>Durum</Th>
            <Th>Tarih</Th>
          </tr>
        </thead>
        <tbody>
          {quotes.length === 0 ? <EmptyRow colSpan={6}>Talep yok.</EmptyRow> : null}
          {quotes.map((quote) => (
            <tr key={quote.id} className="hover:bg-cream-100/60">
              <Td>
                <Link href={`/yonetim/teklifler/${quote.id}`} className="font-mono font-bold hover:underline">
                  {quote.referenceNo}
                </Link>
              </Td>
              <Td>
                <span className="font-semibold">{quote.companyName}</span>
                <span className="block text-xs text-cocoa-500">{[quote.businessType, quote.city].filter(Boolean).join(" · ")}</span>
              </Td>
              <Td className="text-xs">
                {quote.contactName}
                <span className="block text-cocoa-500">{quote.email}</span>
              </Td>
              <Td>{quote._count.items}</Td>
              <Td>
                <Badge tone={quote.status === "NEW" ? "warning" : quote.status === "WON" ? "success" : "neutral"}>{QUOTE_STATUS_LABELS[quote.status]}</Badge>
              </Td>
              <Td className="whitespace-nowrap text-xs text-cocoa-500">{formatDateTime(quote.createdAt)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <Pager page={page} pages={Math.ceil(total / 25)} buildHref={(p) => `/yonetim/teklifler?${new URLSearchParams({ ...(q ? { q } : {}), ...(durum ? { durum } : {}), sayfa: String(p) })}`} />
    </div>
  );
}
