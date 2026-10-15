import { deleteAnnouncementAction, saveAnnouncementAction } from "@/app/actions/admin/marketing";
import { ACheckbox, AdminForm, AField, ConfirmButton } from "@/components/admin/AdminForm";
import { AdminHeader, Badge, Panel } from "@/components/admin/ui";
import { toLocalDateTimeInput } from "@/lib/admin-form";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Duyuru bandı" };

type Announcement = Awaited<ReturnType<typeof db.announcement.findMany>>[number];

function Fields({ item }: { item?: Announcement }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <AField name="message" label="Mesaj" defaultValue={item?.message} maxLength={160} className="md:col-span-2" />
      <AField name="linkUrl" label="Bağlantı (site içi)" defaultValue={item?.linkUrl ?? ""} placeholder="/kategori/evde-tatli-kitleri" />
      <AField name="linkLabel" label="Bağlantı metni" defaultValue={item?.linkLabel ?? ""} />
      <AField name="startsAt" label="Başlangıç (isteğe bağlı)" type="datetime-local" defaultValue={toLocalDateTimeInput(item?.startsAt)} />
      <AField name="endsAt" label="Bitiş (isteğe bağlı)" type="datetime-local" defaultValue={toLocalDateTimeInput(item?.endsAt)} />
      <AField name="sortOrder" label="Sıra" type="number" defaultValue={item?.sortOrder ?? 0} />
      <ACheckbox name="isActive" label="Yayında" defaultChecked={item?.isActive ?? true} />
    </div>
  );
}

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const items = await db.announcement.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-6">
      <AdminHeader title="Duyuru bandı" description="Sitenin en üstündeki ince bant. Yalnızca gerçekten geçerli kampanya ve avantajları yazın; tarih aralığı dışında otomatik gizlenir." />
      {items.map((item) => (
        <details key={item.id} className="group rounded-2xl border border-cocoa-800/10 bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <span className="flex-1 font-semibold">{item.message}</span>
            {item.isActive ? <Badge tone="success">Yayında</Badge> : <Badge>Kapalı</Badge>}
            <span className="text-xs font-bold text-bordeaux-600 group-open:hidden">Düzenle</span>
          </summary>
          <div className="border-t border-cocoa-800/10 p-5">
            <AdminForm action={saveAnnouncementAction}>
              <Fields item={item} />
            </AdminForm>
            <div className="mt-4 border-t border-cocoa-800/10 pt-4">
              <ConfirmButton action={deleteAnnouncementAction} fields={{ id: item.id }} label="Sil" confirmText="Duyuru silinecek. Emin misiniz?" />
            </div>
          </div>
        </details>
      ))}
      <Panel title="Yeni duyuru">
        <AdminForm action={saveAnnouncementAction} submitLabel="Duyuru ekle" resetOnSuccess>
          <Fields />
        </AdminForm>
      </Panel>
    </div>
  );
}
