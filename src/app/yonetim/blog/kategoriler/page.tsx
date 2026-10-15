import { saveBlogCategoryAction } from "@/app/actions/admin/content";
import { AdminForm, AField, ATextArea } from "@/components/admin/AdminForm";
import { AdminHeader, Badge, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Blog kategorileri" };

type Category = { id: string; name: string; slug: string; description: string | null; sortOrder: number; seoTitle: string | null; seoDescription: string | null };

function Fields({ item }: { item?: Category }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <AField name="name" label="Ad" defaultValue={item?.name} />
      <AField name="slug" label="Adres (boşsa addan üretilir)" defaultValue={item?.slug} hint={item ? `/tarifler/kategori/${item.slug}` : undefined} />
      <ATextArea name="description" label="Açıklama" rows={2} defaultValue={item?.description ?? ""} className="md:col-span-2" />
      <AField name="seoTitle" label="SEO başlığı" maxLength={70} defaultValue={item?.seoTitle ?? ""} />
      <AField name="seoDescription" label="SEO açıklaması" maxLength={170} defaultValue={item?.seoDescription ?? ""} />
      <AField name="sortOrder" label="Sıra" type="number" defaultValue={item?.sortOrder ?? 0} />
    </div>
  );
}

export default async function BlogCategoriesPage() {
  await requireAdmin();
  const categories = await db.blogCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { posts: true } } } });
  return (
    <div className="space-y-6">
      <AdminHeader back={{ href: "/yonetim/blog", label: "Blog ve tarifler" }} title="Blog kategorileri" />
      {categories.map((category) => (
        <details key={category.id} className="group rounded-2xl border border-cocoa-800/10 bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <span className="flex-1 font-semibold">{category.name}</span>
            <Badge>{category._count.posts} yazı</Badge>
            <span className="text-xs font-bold text-bordeaux-600 group-open:hidden">Düzenle</span>
          </summary>
          <div className="border-t border-cocoa-800/10 p-5">
            <AdminForm action={saveBlogCategoryAction}>
              <Fields item={category} />
            </AdminForm>
          </div>
        </details>
      ))}
      <Panel title="Yeni kategori">
        <AdminForm action={saveBlogCategoryAction} submitLabel="Kategori ekle" resetOnSuccess>
          <Fields />
        </AdminForm>
      </Panel>
    </div>
  );
}
