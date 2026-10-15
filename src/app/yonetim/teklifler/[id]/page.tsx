import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { replyQuoteAction, updateQuoteAction } from "@/app/actions/admin/crm";
import { AdminForm, ASelect, ATextArea } from "@/components/admin/AdminForm";
import { AdminHeader, Badge, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { QUOTE_STATUS_LABELS, QUOTE_STATUSES, QUOTE_UNIT_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email";
import { formatDateTime, formatPhoneForDisplay } from "@/lib/text";

export const metadata = { title: "Teklif talebi" };

export default async function AdminQuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const quote = await db.quoteRequest.findUnique({
    where: { id },
    include: { items: { include: { variant: { select: { priceKurus: true, product: { select: { id: true } } } } } }, notes: { orderBy: { createdAt: "desc" } } },
  });
  if (!quote) notFound();
  return (
    <div className="space-y-6">
      <AdminHeader
        back={{ href: "/yonetim/teklifler", label: "Teklif talepleri" }}
        title={`${quote.companyName} · ${quote.referenceNo}`}
        description={formatDateTime(quote.createdAt)}
        actions={<Badge tone={quote.status === "NEW" ? "warning" : "neutral"}>{QUOTE_STATUS_LABELS[quote.status]}</Badge>}
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Talep edilen ürünler">
            <ul className="divide-y divide-cocoa-800/8 text-sm">
              {quote.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <span>
                    <span className="font-semibold">{item.productName}</span>
                    {item.variantName ? <span className="text-cocoa-500"> · {item.variantName}</span> : null}
                  </span>
                  <span className="font-bold tabular-nums">
                    {item.quantity} {QUOTE_UNIT_LABELS[item.unit] ?? item.unit}
                  </span>
                </li>
              ))}
            </ul>
            {quote.message ? <p className="mt-4 whitespace-pre-wrap rounded-xl bg-cream-100 p-4 text-sm">{quote.message}</p> : null}
          </Panel>
          <Panel title="Müşteriye yanıt">
            {!isEmailConfigured() ? (
              <p className="mb-3 rounded-lg bg-[#fbf1dc] p-3 text-xs text-[#6b4607]">E-posta gönderimi yapılandırılmadığı için yanıt panelden gönderilemez; aşağıdaki iletişim bilgilerini kullanın.</p>
            ) : null}
            <AdminForm action={replyQuoteAction} submitLabel="E-posta ile gönder" resetOnSuccess>
              <input type="hidden" name="id" value={quote.id} />
              <ATextArea name="message" label="Mesaj" rows={6} placeholder="Teklif detaylarını ve koşulları yazın…" />
            </AdminForm>
          </Panel>
          <Panel title="Geçmiş ve notlar">
            <ul className="space-y-3 text-sm">
              {quote.notes.map((note) => (
                <li key={note.id} className="rounded-xl bg-cream-100 p-3">
                  <p className="text-xs font-bold text-cocoa-500">
                    {note.kind === "EMAIL_SENT" ? "Gönderilen e-posta" : note.kind === "STATUS_CHANGE" ? "Durum değişikliği" : "Not"} · {formatDateTime(note.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{note.body}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="İletişim">
            <p className="font-bold">{quote.contactName}</p>
            <p className="text-sm text-cocoa-600">{quote.companyName}</p>
            <div className="mt-3 space-y-2 text-sm">
              <a href={`mailto:${quote.email}?subject=${encodeURIComponent(`Teklif talebiniz — ${quote.referenceNo}`)}`} className="flex items-center gap-2 text-bordeaux-600 underline">
                <Mail className="size-4" aria-hidden="true" /> {quote.email}
              </a>
              <a href={`tel:${quote.phone}`} className="flex items-center gap-2">
                <Phone className="size-4" aria-hidden="true" /> {formatPhoneForDisplay(quote.phone)}
              </a>
              <p className="text-xs text-cocoa-500">KVKK onayı: {formatDateTime(quote.kvkkConsentAt)}</p>
            </div>
          </Panel>
          <Panel title="Durum ve not">
            <AdminForm action={updateQuoteAction} submitLabel="Güncelle">
              <input type="hidden" name="id" value={quote.id} />
              <ASelect name="status" label="Durum" defaultValue={quote.status} options={QUOTE_STATUSES.map((s) => ({ value: s, label: QUOTE_STATUS_LABELS[s] }))} />
              <ATextArea name="note" label="İç not (isteğe bağlı)" rows={3} />
            </AdminForm>
          </Panel>
        </div>
      </div>
    </div>
  );
}
