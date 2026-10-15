import Link from "next/link";
import { AdminHeader, Badge, EmptyRow, Pager, SearchBar, TableWrap, Td, Th, pageParam } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/text";

export const metadata = { title: "Müşteriler" };

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; sayfa?: string }> }) {
  await requireAdmin();
  const { q, sayfa } = await searchParams;
  const page = pageParam(sayfa);
  const where = q ? { OR: [{ email: { contains: q.toLowerCase() } }, { name: { contains: q } }, { companyName: { contains: q } }] } : {};
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 30,
      take: 30,
      select: { id: true, name: true, email: true, role: true, accountType: true, companyName: true, isActive: true, createdAt: true, priceList: { select: { name: true } }, _count: { select: { orders: true } } },
    }),
    db.user.count({ where }),
  ]);
  return (
    <div>
      <AdminHeader title="Müşteriler" description={`${total} hesap. Misafir siparişler hesap olmadan da kaydedilir.`} />
      <SearchBar action="/yonetim/musteriler" defaultValue={q} placeholder="Ad, e-posta veya işletme" />
      <TableWrap>
        <thead>
          <tr>
            <Th>Hesap</Th>
            <Th>Tür</Th>
            <Th>Sipariş</Th>
            <Th>Fiyat listesi</Th>
            <Th>Kayıt</Th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? <EmptyRow colSpan={5}>Hesap bulunamadı.</EmptyRow> : null}
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-cream-100/60">
              <Td>
                <Link href={`/yonetim/musteriler/${user.id}`} className="font-semibold hover:underline">
                  {user.name}
                </Link>
                <span className="block text-xs text-cocoa-500">{user.email}</span>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {user.role === "ADMIN" ? <Badge tone="dark">Yönetici</Badge> : null}
                  <Badge>{user.accountType === "BUSINESS" ? `İşletme${user.companyName ? ` · ${user.companyName}` : ""}` : "Bireysel"}</Badge>
                  {!user.isActive ? <Badge tone="danger">Pasif</Badge> : null}
                </div>
              </Td>
              <Td>{user._count.orders}</Td>
              <Td className="text-cocoa-600">{user.priceList?.name ?? "—"}</Td>
              <Td className="text-xs text-cocoa-500">{formatDate(user.createdAt)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <Pager page={page} pages={Math.ceil(total / 30)} buildHref={(p) => `/yonetim/musteriler?${new URLSearchParams({ ...(q ? { q } : {}), sayfa: String(p) })}`} />
    </div>
  );
}
