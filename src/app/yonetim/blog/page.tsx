import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { AdminHeader, Badge, EmptyRow, Pager, SearchBar, TableWrap, Td, Th, pageParam } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/text";

export const metadata = { title: "Blog ve tarifler" };

const TYPE_LABELS: Record<string, string> = { ARTICLE: "Yazı", RECIPE: "Tarif", GUIDE: "Rehber" };

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<{ q?: string; durum?: string; sayfa?: string }> }) {
  await requireAdmin();
  const { q, durum, sayfa } = await searchParams;
  const page = pageParam(sayfa);
  const now = new Date();
  const and: Prisma.BlogPostWhereInput[] = [];
  if (durum === "DRAFT") and.push({ status: "DRAFT" });
  if (durum === "PUBLISHED") and.push({ status: "PUBLISHED", publishedAt: { lte: now } });
  if (durum === "SCHEDULED") and.push({ status: "PUBLISHED", publishedAt: { gt: now } });
  if (q) and.push({ OR: [{ title: { contains: q } }, { slug: { contains: q.toLowerCase() } }] });
  const where: Prisma.BlogPostWhereInput = and.length ? { AND: and } : {};
  const [posts, total] = await Promise.all([
    db.blogPost.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * 30,
      take: 30,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        coverImageUrl: true,
        category: { select: { name: true } },
        _count: { select: { products: true } },
      },
    }),
    db.blogPost.count({ where }),
  ]);
  return (
    <div>
      <AdminHeader
        title="Blog ve tarifler"
        description="Lezzet Günlüğü yazıları. Taslaklar sitede görünmez; ileri tarihli yayınlar o saatte (en geç 5 dakika içinde) görünür olur."
        actions={
          <>
            <Link href="/yonetim/blog/kategoriler" className="btn btn-sm btn-outline">
              Kategoriler
            </Link>
            <Link href="/yonetim/blog/yeni" className="btn btn-sm btn-primary">
              <Plus className="size-4" aria-hidden="true" /> Yeni yazı
            </Link>
          </>
        }
      />
      <SearchBar action="/yonetim/blog" defaultValue={q} placeholder="Başlık veya adres">
        <label className="sr-only" htmlFor="blog-status">
          Durum
        </label>
        <select id="blog-status" name="durum" defaultValue={durum ?? ""} className="field-input !min-h-10 !w-auto !py-1.5 text-sm">
          <option value="">Tüm durumlar</option>
          <option value="PUBLISHED">Yayında</option>
          <option value="SCHEDULED">Zamanlanmış</option>
          <option value="DRAFT">Taslak</option>
        </select>
      </SearchBar>
      <TableWrap>
        <thead>
          <tr>
            <Th>Yazı</Th>
            <Th>Tür</Th>
            <Th>Durum</Th>
            <Th>Ürün</Th>
            <Th>Güncelleme</Th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? <EmptyRow colSpan={5}>Yazı bulunamadı.</EmptyRow> : null}
          {posts.map((post) => {
            const scheduled = post.status === "PUBLISHED" && post.publishedAt && post.publishedAt > now;
            return (
              <tr key={post.id} className="hover:bg-cream-100/60">
                <Td>
                  <Link href={`/yonetim/blog/${post.id}`} className="font-semibold hover:underline">
                    {post.title}
                  </Link>
                  <span className="block text-xs text-cocoa-500">
                    /tarifler/{post.slug}
                    {post.category ? ` · ${post.category.name}` : ""}
                    {post.coverImageUrl ? "" : " · kapak görseli yok"}
                  </span>
                </Td>
                <Td>{TYPE_LABELS[post.type] ?? post.type}</Td>
                <Td>
                  {post.status === "DRAFT" ? (
                    <Badge>Taslak</Badge>
                  ) : scheduled ? (
                    <Badge tone="info">Zamanlanmış · {formatDateTime(post.publishedAt!)}</Badge>
                  ) : (
                    <Badge tone="success">Yayında</Badge>
                  )}
                </Td>
                <Td>{post._count.products}</Td>
                <Td className="text-xs text-cocoa-500">{formatDateTime(post.updatedAt)}</Td>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>
      <Pager page={page} pages={Math.ceil(total / 30)} buildHref={(p) => `/yonetim/blog?${new URLSearchParams({ ...(q ? { q } : {}), ...(durum ? { durum } : {}), sayfa: String(p) })}`} />
    </div>
  );
}
