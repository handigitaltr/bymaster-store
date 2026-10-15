import { deleteFaqAction, saveFaqAction } from "@/app/actions/admin/content";
import { ACheckbox, AdminForm, AField, ATextArea, ConfirmButton } from "@/components/admin/AdminForm";
import { AdminHeader, Badge, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Sık sorulan sorular" };

type Faq = { id: string; question: string; answer: string; group: string | null; sortOrder: number; isPublished: boolean };

function Fields({ item }: { item?: Faq }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_12rem_8rem]">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <AField name="question" label="Soru" defaultValue={item?.question} maxLength={200} />
      <AField name="group" label="Grup" defaultValue={item?.group ?? ""} placeholder="ör. Kargo" />
      <AField name="sortOrder" label="Sıra" type="number" defaultValue={item?.sortOrder ?? 0} />
      <ATextArea name="answer" label="Yanıt" rows={4} defaultValue={item?.answer} className="md:col-span-3" hint="Yalnızca doğrulanmış bilgileri yazın (teslimat süresi, iade koşulları vb.)." />
      <ACheckbox name="isPublished" label="Yayında" defaultChecked={item?.isPublished ?? true} />
    </div>
  );
}

export default async function AdminFaqPage() {
  await requireAdmin();
  const items = await db.faqItem.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }] });
  return (
    <div className="space-y-6">
      <AdminHeader
        back={{ href: "/yonetim/sayfalar", label: "Sayfalar" }}
        title="Sık sorulan sorular"
        description="SSS sayfasında gruplar hâlinde gösterilir ve arama motorları için yapılandırılmış veri (FAQPage) olarak işaretlenir."
      />
      {items.map((item) => (
        <details key={item.id} className="group rounded-2xl border border-cocoa-800/10 bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <span className="flex-1 font-semibold">{item.question}</span>
            {item.group ? <Badge>{item.group}</Badge> : null}
            {item.isPublished ? <Badge tone="success">Yayında</Badge> : <Badge>Gizli</Badge>}
          </summary>
          <div className="border-t border-cocoa-800/10 p-5">
            <AdminForm action={saveFaqAction}>
              <Fields item={item} />
            </AdminForm>
            <div className="mt-4 border-t border-cocoa-800/10 pt-4">
              <ConfirmButton action={deleteFaqAction} fields={{ id: item.id }} label="Sil" confirmText="Soru silinecek. Emin misiniz?" />
            </div>
          </div>
        </details>
      ))}
      <Panel title="Yeni soru">
        <AdminForm action={saveFaqAction} submitLabel="Soru ekle" resetOnSuccess>
          <Fields />
        </AdminForm>
      </Panel>
    </div>
  );
}
