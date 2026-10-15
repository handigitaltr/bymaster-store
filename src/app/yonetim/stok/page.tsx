import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { bulkPriceAction, updateStockAction } from "@/app/actions/admin/catalog";
import { ACheckbox, AdminForm, AField, ASelect } from "@/components/admin/AdminForm";
import { AdminHeader, Badge, Panel, SearchBar, TableWrap, Td, Th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { INVENTORY_REASON_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { formatDateTime, searchTerms } from "@/lib/text";

export const metadata = { title: "Stok ve fiyat" };

export default async function AdminStockPage({ searchParams }: { searchParams: Promise<{ q?: string; filtre?: string }> }) {
  await requireAdmin();
  const { q, filtre } = await searchParams;
  const and: Prisma.ProductVariantWhereInput[] = [{ product: { status: { not: "ARCHIVED" } } }];
  if (q) for (const term of searchTerms(q)) and.push({ product: { searchText: { contains: term } } });
  if (filtre === "takipsiz") and.push({ trackStock: false });
  if (filtre === "kritik") and.push({ trackStock: true, stock: { lte: 5 } });

  const [variants, movements, categories, waiting] = await Promise.all([
    db.productVariant.findMany({
      where: { AND: and },
      orderBy: [{ product: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: { product: { select: { id: true, name: true } }, _count: { select: { stockNotifications: { where: { notifiedAt: null } } } } },
      take: 200,
    }),
    db.inventoryMovement.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { variant: { select: { sku: true, product: { select: { name: true } } } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.stockNotification.count({ where: { notifiedAt: null } }),
  ]);

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Stok ve fiyat"
        description={`Stok değişiklikleri hareket kaydıyla tutulur. ${waiting ? `${waiting} kişi “haber ver” listesinde; stok sıfırdan pozitife geçtiğinde e-posta gönderilir.` : ""}`}
      />
      <SearchBar action="/yonetim/stok" defaultValue={q} placeholder="Ürün ara">
        <select name="filtre" defaultValue={filtre ?? ""} className="field-input !min-h-10 !w-auto !py-1.5 text-sm" aria-label="Filtre">
          <option value="">Tümü</option>
          <option value="takipsiz">Stok takibi kapalı</option>
          <option value="kritik">Kritik stok (≤5)</option>
        </select>
      </SearchBar>

      <TableWrap>
        <thead>
          <tr>
            <Th>Ürün / varyant</Th>
            <Th className="text-right">Fiyat</Th>
            <Th>Mevcut stok</Th>
            <Th>Güncelle</Th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant.id} className="align-top">
              <Td>
                <Link href={`/yonetim/urunler/${variant.product.id}`} className="font-semibold hover:underline">
                  {variant.product.name}
                </Link>
                <span className="block text-xs text-cocoa-500">
                  {variant.name} · <span className="font-mono">{variant.sku}</span>
                </span>
                {variant._count.stockNotifications ? <span className="mt-1 inline-block"><Badge tone="info">{variant._count.stockNotifications} kişi bekliyor</Badge></span> : null}
              </Td>
              <Td className="text-right tabular-nums">{variant.priceKurus > 0 ? formatTRY(variant.priceKurus) : "—"}</Td>
              <Td>
                {variant.trackStock ? (
                  <Badge tone={variant.stock <= 0 ? "danger" : variant.stock <= variant.lowStockThreshold ? "warning" : "success"}>{variant.stock} adet</Badge>
                ) : (
                  <Badge>Takip kapalı</Badge>
                )}
              </Td>
              <Td className="min-w-[26rem]">
                <AdminForm action={updateStockAction} submitLabel="Uygula" submitVariant="btn-outline btn-sm" resetOnSuccess>
                  <input type="hidden" name="variantId" value={variant.id} />
                  <div className="grid grid-cols-[7rem_6rem_1fr] gap-2">
                    <select name="mode" defaultValue="set" className="field-input !min-h-9 !py-1 text-xs" aria-label="İşlem">
                      <option value="set">Stoğu ayarla</option>
                      <option value="add">Ekle / çıkar</option>
                    </select>
                    <input name="amount" type="number" defaultValue={variant.stock} className="field-input !min-h-9 !py-1 text-sm" aria-label="Miktar" />
                    <select name="reason" defaultValue="RESTOCK" className="field-input !min-h-9 !py-1 text-xs" aria-label="Neden">
                      <option value="RESTOCK">Stok girişi</option>
                      <option value="CORRECTION">Sayım düzeltmesi</option>
                      <option value="ADJUSTMENT">Diğer düzeltme</option>
                      <option value="RETURN">İade</option>
                    </select>
                  </div>
                  <input name="note" placeholder="Not (isteğe bağlı)" className="field-input !min-h-9 !py-1 text-sm" aria-label="Not" />
                  <ACheckbox name="trackStock" label="Stok takibi açık" defaultChecked={variant.trackStock} />
                </AdminForm>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Toplu fiyat güncelleme">
          <AdminForm action={bulkPriceAction} submitLabel="Fiyatları güncelle" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-3">
              <AField name="percent" label="Değişim (%)" type="number" step="0.1" placeholder="ör. 12,5 veya -5" />
              <ASelect name="categoryId" label="Kapsam" options={[{ value: "", label: "Tüm ürünler" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
              <ASelect
                name="rounding"
                label="Yuvarlama"
                options={[
                  { value: "none", label: "Yuvarlama yok" },
                  { value: "1", label: "1 TL'ye" },
                  { value: "10", label: "10 TL'ye" },
                  { value: "50", label: "50 TL'ye" },
                ]}
              />
            </div>
            <ACheckbox name="confirm" label="Fiyatların kalıcı olarak değişeceğini onaylıyorum." hint="Önceki fiyat (indirim) alanları temizlenir; işlem kayıt altına alınır." />
          </AdminForm>
        </Panel>
        <Panel title="Son stok hareketleri">
          <ul className="divide-y divide-cocoa-800/8 text-sm">
            {movements.length === 0 ? <li className="py-3 text-cocoa-500">Henüz hareket yok.</li> : null}
            {movements.map((movement) => (
              <li key={movement.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className={movement.change > 0 ? "font-bold text-success" : "font-bold text-danger"}>{movement.change > 0 ? `+${movement.change}` : movement.change}</span>
                <span className="font-semibold">{movement.variant.product.name}</span>
                <span className="text-cocoa-500">→ {movement.stockAfter}</span>
                <span className="text-xs text-cocoa-500">{INVENTORY_REASON_LABELS[movement.reason] ?? movement.reason}</span>
                <span className="ml-auto text-xs text-cocoa-400">{formatDateTime(movement.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
