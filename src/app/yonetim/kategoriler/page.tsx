import Image from "next/image";
import { deleteCategoryAction, saveCategoryAction } from "@/app/actions/admin/catalog";
import { ACheckbox, AdminForm, AField, ATextArea, ConfirmButton } from "@/components/admin/AdminForm";
import { AdminHeader, Badge, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Kategoriler" };

type Category = Awaited<ReturnType<typeof load>>[number];

function load() {
  return db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
}

function CategoryFields({ category }: { category?: Category }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <AField name="name" label="Ad" defaultValue={category?.name} />
      <AField name="shortName" label="Kısa ad (menü)" defaultValue={category?.shortName ?? ""} />
      <AField name="slug" label="Adres (slug)" defaultValue={category?.slug} hint="Boş bırakılırsa addan üretilir." />
      <AField name="menuGroup" label="Mega menü grubu" defaultValue={category?.menuGroup ?? ""} hint="Soslar, Süslemeler, Karışımlar ve Kitler…" />
      <ATextArea name="description" label="Açıklama" rows={2} defaultValue={category?.description ?? ""} className="md:col-span-2" />
      <AField name="imageUrl" label="Görsel yolu" defaultValue={category?.imageUrl ?? ""} placeholder="/images/products/…" />
      <AField name="imageAlt" label="Görsel alt metni" defaultValue={category?.imageAlt ?? ""} />
      <AField name="accentColor" label="Vurgu rengi" defaultValue={category?.accentColor ?? ""} placeholder="#BC8855" />
      <AField name="sortOrder" label="Sıra" type="number" defaultValue={category?.sortOrder ?? 0} />
      <AField name="seoTitle" label="SEO başlığı" defaultValue={category?.seoTitle ?? ""} maxLength={70} />
      <AField name="seoDescription" label="SEO açıklaması" defaultValue={category?.seoDescription ?? ""} maxLength={170} />
      <ACheckbox name="isActive" label="Vitrinde göster" defaultChecked={category?.isActive ?? true} />
    </div>
  );
}

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await load();
  return (
    <div className="space-y-6">
      <AdminHeader title="Kategoriler" description="Kategori sırası mega menüde, ana sayfada ve filtrelerde kullanılır." />
      <div className="space-y-4">
        {categories.map((category) => (
          <details key={category.id} className="group rounded-2xl border border-cocoa-800/10 bg-white">
            <summary className="flex cursor-pointer list-none items-center gap-4 p-4 [&::-webkit-details-marker]:hidden">
              <span className="relative size-12 flex-none overflow-hidden rounded-lg bg-cream-200">
                {category.imageUrl ? <Image src={category.imageUrl} alt="" fill sizes="48px" className="object-cover" /> : null}
              </span>
              <span className="flex-1">
                <span className="block font-bold text-cocoa-900">{category.name}</span>
                <span className="block text-xs text-cocoa-500">
                  /kategori/{category.slug} · {category._count.products} ürün · sıra {category.sortOrder}
                </span>
              </span>
              {category.isActive ? <Badge tone="success">Görünür</Badge> : <Badge>Gizli</Badge>}
              <span className="text-xs font-bold text-bordeaux-600 group-open:hidden">Düzenle</span>
            </summary>
            <div className="border-t border-cocoa-800/10 p-5">
              <AdminForm action={saveCategoryAction}>
                <CategoryFields category={category} />
              </AdminForm>
              <div className="mt-4 border-t border-cocoa-800/10 pt-4">
                {category._count.products === 0 ? (
                  <ConfirmButton action={deleteCategoryAction} fields={{ id: category.id }} label="Kategoriyi sil" confirmText="Kategori silinecek. Emin misiniz?" />
                ) : (
                  <p className="text-xs text-cocoa-500">Ürünü olan kategori silinemez; gizlemek için “Vitrinde göster” seçeneğini kaldırın.</p>
                )}
              </div>
            </div>
          </details>
        ))}
      </div>
      <Panel title="Yeni kategori">
        <AdminForm action={saveCategoryAction} submitLabel="Kategori ekle" resetOnSuccess>
          <CategoryFields />
        </AdminForm>
      </Panel>
    </div>
  );
}
