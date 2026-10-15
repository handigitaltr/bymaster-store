import { savePriceListAction } from "@/app/actions/admin/crm";
import { ACheckbox, AdminForm, AField } from "@/components/admin/AdminForm";
import { AdminHeader, Badge, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatTRY, kurusToInput } from "@/lib/money";

export const metadata = { title: "B2B fiyat listeleri" };

type Variant = { id: string; name: string; sku: string; priceKurus: number; product: { name: string } };

function PriceRows({ variants, entries }: { variants: Variant[]; entries: Map<string, { priceKurus: number; minQty: number }> }) {
  return (
    <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-cocoa-800/10">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-cream-100 text-left text-xs uppercase tracking-wider text-cocoa-500">
          <tr>
            <th className="px-3 py-2">Ürün</th>
            <th className="px-3 py-2 text-right">Liste fiyatı</th>
            <th className="px-3 py-2">Özel fiyat (₺)</th>
            <th className="px-3 py-2">En az adet</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cocoa-800/6">
          {variants.map((variant) => {
            const entry = entries.get(variant.id);
            return (
              <tr key={variant.id}>
                <td className="px-3 py-1.5">
                  {variant.product.name}
                  <span className="block text-xs text-cocoa-500">{variant.name}</span>
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-cocoa-600">{formatTRY(variant.priceKurus)}</td>
                <td className="px-3 py-1.5">
                  <input name={`price_${variant.id}`} defaultValue={kurusToInput(entry?.priceKurus)} className="field-input !min-h-9 !w-32 !py-1 text-sm" aria-label={`${variant.product.name} özel fiyat`} />
                </td>
                <td className="px-3 py-1.5">
                  <input name={`min_${variant.id}`} defaultValue={entry?.minQty ?? 1} inputMode="numeric" className="field-input !min-h-9 !w-20 !py-1 text-sm" aria-label={`${variant.product.name} en az adet`} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminPriceListsPage() {
  await requireAdmin();
  const [lists, variants] = await Promise.all([
    db.priceList.findMany({ orderBy: { createdAt: "asc" }, include: { entries: true, _count: { select: { users: true } } } }),
    db.productVariant.findMany({
      where: { isActive: true, priceKurus: { gt: 0 }, product: { status: { not: "ARCHIVED" } } },
      orderBy: [{ product: { sortOrder: "asc" } }],
      select: { id: true, name: true, sku: true, priceKurus: true, product: { select: { name: true } } },
    }),
  ]);
  return (
    <div className="space-y-6">
      <AdminHeader
        title="B2B fiyat listeleri"
        description="İşletme müşterilerine özel fiyatlar. Liste, müşteri detayında hesaba atanır; özel fiyat yalnızca liste fiyatından düşükse ve sepet adedi “en az adet” koşulunu sağlıyorsa uygulanır. Boş bıraktığınız ürünlerde liste fiyatı geçerlidir."
      />
      {lists.map((list) => (
        <details key={list.id} className="group rounded-2xl border border-cocoa-800/10 bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <span className="flex-1 font-bold">{list.name}</span>
            <Badge>{list.entries.length} özel fiyat</Badge>
            <Badge>{list._count.users} müşteri</Badge>
            {list.isActive ? <Badge tone="success">Aktif</Badge> : <Badge>Pasif</Badge>}
          </summary>
          <div className="border-t border-cocoa-800/10 p-5">
            <AdminForm action={savePriceListAction}>
              <input type="hidden" name="id" value={list.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <AField name="name" label="Liste adı" defaultValue={list.name} />
                <AField name="description" label="Açıklama" defaultValue={list.description ?? ""} />
              </div>
              <ACheckbox name="isActive" label="Aktif" defaultChecked={list.isActive} />
              <PriceRows variants={variants} entries={new Map(list.entries.map((e) => [e.variantId, e]))} />
            </AdminForm>
          </div>
        </details>
      ))}
      <Panel title="Yeni fiyat listesi">
        <AdminForm action={savePriceListAction} submitLabel="Liste oluştur" resetOnSuccess>
          <div className="grid gap-4 md:grid-cols-2">
            <AField name="name" label="Liste adı" placeholder="ör. Kafe anlaşmalı fiyatlar" />
            <AField name="description" label="Açıklama" />
          </div>
          <ACheckbox name="isActive" label="Aktif" defaultChecked />
          <PriceRows variants={variants} entries={new Map()} />
        </AdminForm>
      </Panel>
    </div>
  );
}
