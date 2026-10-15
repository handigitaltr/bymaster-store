import Link from "next/link";
import { notFound } from "next/navigation";
import { updateReturnAction } from "@/app/actions/admin/crm";
import { AdminForm, AField, ASelect, ATextArea } from "@/components/admin/AdminForm";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { RETURN_REASON_LABELS, RETURN_STATUS_LABELS, RETURN_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { kurusToInput } from "@/lib/money";
import { formatDateTime } from "@/lib/text";

export const metadata = { title: "İade talebi" };

export default async function AdminReturnDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const request = await db.returnRequest.findUnique({
    where: { id },
    include: { order: { select: { id: true, orderNumber: true, customerName: true, phone: true } }, items: { include: { orderItem: true } } },
  });
  if (!request) notFound();
  return (
    <div className="space-y-6">
      <AdminHeader back={{ href: "/yonetim/iadeler", label: "İade talepleri" }} title={`Talep ${request.referenceNo}`} description={formatDateTime(request.createdAt)} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Talep" className="xl:col-span-2">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Sipariş</dt>
              <dd>
                <Link href={`/yonetim/siparisler/${request.order.id}`} className="font-mono underline">
                  {request.order.orderNumber}
                </Link>{" "}
                · {request.order.customerName} · <a href={`mailto:${request.email}`} className="underline">{request.email}</a> · <a href={`tel:${request.order.phone}`}>{request.order.phone}</a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Neden</dt>
              <dd>{RETURN_REASON_LABELS[request.reason]}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Ürünler</dt>
              <dd>
                <ul className="list-disc pl-5">
                  {request.items.map((item) => (
                    <li key={item.id}>
                      {item.orderItem.productName} ({item.orderItem.variantName}) × {item.quantity}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Açıklama</dt>
              <dd className="whitespace-pre-wrap">{request.details}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Durum">
          <AdminForm action={updateReturnAction} submitLabel="Güncelle">
            <input type="hidden" name="id" value={request.id} />
            <ASelect name="status" label="Durum" defaultValue={request.status} options={RETURN_STATUSES.map((s) => ({ value: s, label: RETURN_STATUS_LABELS[s] }))} />
            <AField name="refundAmount" label="İade tutarı (₺, isteğe bağlı)" defaultValue={kurusToInput(request.refundAmountKurus)} />
            <ATextArea name="adminNote" label="İç not" rows={4} defaultValue={request.adminNote ?? ""} />
          </AdminForm>
          <p className="mt-4 text-xs text-cocoa-500">
            Ücret iadesini ödeme kuruluşu panelinden yaptıktan sonra sipariş sayfasından “ücret iadesi kaydı” oluşturun. Stok iadesi için Stok sayfasında “İade” nedeniyle giriş yapın.
          </p>
        </Panel>
      </div>
    </div>
  );
}
