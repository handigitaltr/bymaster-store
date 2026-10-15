import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { setProductStatusAction } from "@/app/actions/admin/products";
import { AdminHeader, Badge, EmptyRow, Pager, SearchBar, TableWrap, Td, Th, pageParam } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { PRODUCT_STATUS_LABELS, SALE_STATUS_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { searchTerms } from "@/lib/text";

type Props = { searchParams: Promise<{ q?: string; durum?: string; kategori?: string; eksik?: string; sayfa?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireAdmin();
  const { q, durum, kategori, eksik, sayfa } = await searchParams;
  const page = pageParam(sayfa);
  const pageSize = 30;
  const and: Prisma.ProductWhereInput[] = [];
  if (durum && ["DRAFT", "ACTIVE", "ARCHIVED"].includes(durum)) and.push({ status: durum });
  if (kategori) and.push({ categories: { some: { categoryId: kategori } } });
  if (eksik === "bilgi") and.push({ OR: [{ allergens: null }, { ingredients: null }] });
  if (eksik === "gorsel") and.push({ OR: [{ images: { none: {} } }, { images: { some: { isPlaceholder: true } } }] });
  if (q) for (const term of searchTerms(q)) and.push({ searchText: { contains: term } });
  const where: Prisma.ProductWhereInput = and.length ? { AND: and } : {};

  const [products, total, categories] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ primaryCategory: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        saleStatus: true,
        isFeatured: true,
        allergens: true,
        ingredients: true,
        primaryCategory: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, isPlaceholder: true, fit: true } },
        variants: { where: { isActive: true }, orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }], select: { priceKurus: true, trackStock: true, stock: true, sku: true } },
      },
    }),
    db.product.count({ where }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  const href = (p: number) =>
    `/yonetim/urunler?${new URLSearchParams({ ...(q ? { q } : {}), ...(durum ? { durum } : {}), ...(kategori ? { kategori } : {}), ...(eksik ? { eksik } : {}), sayfa: String(p) })}`;

  return (
    <div>
      <AdminHeader
        title="Ürünler"
        description={`${total} ürün${eksik === "bilgi" ? " · içindekiler veya alerjen bilgisi eksik olanlar" : eksik === "gorsel" ? " · gerçek fotoğrafı olmayanlar" : ""}`}
        actions={
          <Link href="/yonetim/urunler/yeni" className="btn btn-sm btn-primary">
            <Plus className="size-4" aria-hidden="true" /> Yeni ürün
          </Link>
        }
      />
      <SearchBar action="/yonetim/urunler" defaultValue={q} placeholder="Ürün adı veya stok kodu">
        <select name="durum" defaultValue={durum ?? ""} className="field-input !min-h-10 !w-auto !py-1.5 text-sm" aria-label="Durum">
          <option value="">Tüm durumlar</option>
          {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="kategori" defaultValue={kategori ?? ""} className="field-input !min-h-10 !w-auto !py-1.5 text-sm" aria-label="Kategori">
          <option value="">Tüm kategoriler</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select name="eksik" defaultValue={eksik ?? ""} className="field-input !min-h-10 !w-auto !py-1.5 text-sm" aria-label="Eksik bilgi">
          <option value="">Tümü</option>
          <option value="bilgi">İçerik/alerjen eksik</option>
          <option value="gorsel">Fotoğraf eksik</option>
        </select>
      </SearchBar>
      <TableWrap>
        <thead>
          <tr>
            <Th>Ürün</Th>
            <Th>Kategori</Th>
            <Th className="text-right">Fiyat</Th>
            <Th>Stok</Th>
            <Th>Durum</Th>
            <Th>Bilgi</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? <EmptyRow colSpan={7}>Ürün bulunamadı.</EmptyRow> : null}
          {products.map((product) => {
            const variant = product.variants[0];
            const image = product.images[0];
            return (
              <tr key={product.id} className="hover:bg-cream-100/60">
                <Td>
                  <Link href={`/yonetim/urunler/${product.id}`} className="flex items-center gap-3">
                    <span className="relative size-12 flex-none overflow-hidden rounded-lg bg-cream-200">
                      {image ? <Image src={image.url} alt="" fill sizes="48px" className={image.fit === "cover" ? "object-cover" : "object-contain p-1 mix-blend-multiply"} /> : null}
                    </span>
                    <span>
                      <span className="block font-semibold text-cocoa-900 hover:underline">{product.name}</span>
                      <span className="block font-mono text-xs text-cocoa-500">{variant?.sku ?? "—"}</span>
                    </span>
                  </Link>
                </Td>
                <Td className="text-cocoa-600">{product.primaryCategory.name}</Td>
                <Td className="text-right font-bold tabular-nums">{variant && variant.priceKurus > 0 ? formatTRY(variant.priceKurus) : "—"}</Td>
                <Td>{variant ? (variant.trackStock ? <Badge tone={variant.stock > 0 ? "neutral" : "danger"}>{variant.stock}</Badge> : <Badge>Takip yok</Badge>) : "—"}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={product.status === "ACTIVE" ? "success" : product.status === "DRAFT" ? "warning" : "neutral"}>{PRODUCT_STATUS_LABELS[product.status]}</Badge>
                    {product.saleStatus === "COMING_SOON" ? <Badge tone="info">{SALE_STATUS_LABELS.COMING_SOON}</Badge> : null}
                    {product.isFeatured ? <Badge tone="dark">Öne çıkan</Badge> : null}
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {!product.ingredients || !product.allergens ? <Badge tone="warning">İçerik/alerjen eksik</Badge> : null}
                    {!image || image.isPlaceholder ? <Badge tone="warning">Temsili görsel</Badge> : null}
                  </div>
                </Td>
                <Td className="text-right">
                  <form action={setProductStatusAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="status" value={product.status === "ACTIVE" ? "DRAFT" : "ACTIVE"} />
                    <button type="submit" className="text-xs font-bold text-cocoa-600 underline hover:text-cocoa-900">
                      {product.status === "ACTIVE" ? "Yayından kaldır" : "Yayınla"}
                    </button>
                  </form>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>
      <Pager page={page} pages={Math.ceil(total / pageSize)} buildHref={href} />
    </div>
  );
}
