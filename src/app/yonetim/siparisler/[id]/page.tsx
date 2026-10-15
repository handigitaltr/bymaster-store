import Link from "next/link";
import { notFound } from "next/navigation";
import { resendConfirmationAction } from "@/app/actions/admin/orders";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";
import { NoteForm, RefundForm, TransitionForm } from "@/components/admin/OrderActions";
import { AdminHeader, Badge, Panel } from "@/components/admin/ui";
import { AgreementButton } from "@/components/order/OrderClient";
import { requireAdmin } from "@/lib/auth/guards";
import { ORDER_STATUS_LABELS, ORDER_TRANSITIONS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, RETURN_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { PROVIDER_LABELS } from "@/lib/payments/config";
import { formatDateTime, formatPhoneForDisplay } from "@/lib/text";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "asc" } },
      agreements: true,
      returnRequests: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });
  if (!order) notFound();
  const options = ORDER_TRANSITIONS[order.status as OrderStatus] ?? [];

  return (
    <div className="space-y-6">
      <AdminHeader
        back={{ href: "/yonetim/siparisler", label: "Siparişler" }}
        title={`Sipariş ${order.orderNumber}`}
        description={`${formatDateTime(order.createdAt)} · ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`}
        actions={
          <>
            {order.isTest ? <Badge tone="danger">Test siparişi</Badge> : null}
            <OrderStatusPill status={order.status} />
            <Badge tone={order.paymentStatus === "PAID" ? "success" : "neutral"}>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</Badge>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Ürünler">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-cocoa-500">
                <tr>
                  <th className="pb-2">Ürün</th>
                  <th className="pb-2">Stok kodu</th>
                  <th className="pb-2 text-right">Adet</th>
                  <th className="pb-2 text-right">Birim</th>
                  <th className="pb-2 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cocoa-800/8">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5">
                      {item.productId ? (
                        <Link href={`/yonetim/urunler/${item.productId}`} className="font-semibold hover:underline">
                          {item.productName}
                        </Link>
                      ) : (
                        <span className="font-semibold">{item.productName}</span>
                      )}
                      <span className="block text-xs text-cocoa-500">
                        {item.variantName} · KDV %{item.vatRate}
                        {item.discountKurus > 0 ? ` · indirim payı ${formatTRY(item.discountKurus)}` : ""}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-xs">{item.sku}</td>
                    <td className="py-2.5 text-right tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatTRY(item.unitPriceKurus)}</td>
                    <td className="py-2.5 text-right font-bold tabular-nums">{formatTRY(item.lineTotalKurus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto mt-4 max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between"><dt>Ara toplam</dt><dd className="tabular-nums">{formatTRY(order.subtotalKurus)}</dd></div>
              {order.discountKurus > 0 ? (
                <div className="flex justify-between text-success"><dt>İndirim {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd className="tabular-nums">−{formatTRY(order.discountKurus)}</dd></div>
              ) : null}
              <div className="flex justify-between"><dt>Kargo</dt><dd className="tabular-nums">{formatTRY(order.shippingKurus)}</dd></div>
              <div className="flex justify-between border-t border-cocoa-800/10 pt-1.5 font-extrabold"><dt>Toplam</dt><dd className="tabular-nums">{formatTRY(order.totalKurus)}</dd></div>
              <div className="flex justify-between text-xs text-cocoa-500"><dt>Dahil KDV</dt><dd className="tabular-nums">{formatTRY(order.vatKurus)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Ödeme denemeleri">
            {order.payments.length === 0 ? (
              <p className="text-sm text-cocoa-500">{order.paymentMethod === "BANK_TRANSFER" ? "Havale/EFT siparişi — ödeme elle onaylanır." : "Henüz ödeme denemesi yok."}</p>
            ) : (
              <ul className="divide-y divide-cocoa-800/8 text-sm">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                    <span className="font-mono text-xs">{payment.reference}</span>
                    <span>{PROVIDER_LABELS[payment.provider] ?? payment.provider}</span>
                    <Badge tone={payment.mode === "TEST" ? "danger" : "neutral"}>{payment.mode}</Badge>
                    <Badge tone={payment.status === "SUCCEEDED" ? "success" : payment.status === "FAILED" ? "danger" : "neutral"}>{payment.status}</Badge>
                    <span className="tabular-nums">{formatTRY(payment.paidAmountKurus ?? payment.amountKurus)}</span>
                    <span className="text-xs text-cocoa-500">{formatDateTime(payment.createdAt)}</span>
                    {payment.failureMessage ? <span className="w-full text-xs text-danger">{payment.failureMessage}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Sipariş geçmişi">
            <ol className="space-y-3 text-sm">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <span className="mt-1.5 size-2 flex-none rounded-full bg-caramel-500" aria-hidden="true" />
                  <span>
                    <span className="font-bold">{ORDER_STATUS_LABELS[event.toStatus as OrderStatus] ?? event.toStatus}</span>
                    {!event.isCustomerVisible ? <span className="ml-2"><Badge tone="warning">İç kayıt</Badge></span> : null}
                    {event.note ? <span className="block text-cocoa-600">{event.note}</span> : null}
                    <span className="block text-xs text-cocoa-400">{formatDateTime(event.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Durum güncelle">
            <TransitionForm key={order.status} orderId={order.id} options={options} />
          </Panel>
          <Panel title="Müşteri">
            <div className="space-y-1 text-sm">
              <p className="font-bold">{order.customerName}</p>
              <p>
                <a href={`mailto:${order.email}`} className="text-bordeaux-600 underline">{order.email}</a>
              </p>
              <p>
                <a href={`tel:${order.phone}`}>{formatPhoneForDisplay(order.phone)}</a>
              </p>
              <p className="text-xs text-cocoa-500">
                {order.user ? (
                  <>Üye hesabı: <Link href={`/yonetim/musteriler/${order.user.id}`} className="underline">{order.user.email}</Link></>
                ) : (
                  "Misafir sipariş"
                )}
                {order.marketingConsent ? " · İleti onayı var" : ""}
              </p>
            </div>
            <div className="mt-4 border-t border-cocoa-800/10 pt-4 text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Teslimat</p>
              <p className="mt-1">{order.shipFullName} · {formatPhoneForDisplay(order.shipPhone)}</p>
              <p className="text-cocoa-600">{order.shipAddressLine}, {order.shipDistrict} / {order.shipCity} {order.shipPostalCode ?? ""}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-cocoa-500">Fatura ({order.billType === "CORPORATE" ? "kurumsal" : "bireysel"})</p>
              {order.billType === "CORPORATE" ? (
                <p className="mt-1">{order.billCompanyName} · {order.billTaxOffice} V.D. · {order.billTaxNumber}</p>
              ) : (
                <p className="mt-1">{order.billFullName}</p>
              )}
              <p className="text-cocoa-600">{order.billAddressLine}, {order.billDistrict} / {order.billCity}</p>
              {order.customerNote ? (
                <>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-cocoa-500">Müşteri notu</p>
                  <p className="mt-1 whitespace-pre-wrap">{order.customerNote}</p>
                </>
              ) : null}
              {order.trackingNumber ? (
                <p className="mt-3">Kargo: {order.shippingCarrier} · <span className="font-mono">{order.trackingNumber}</span></p>
              ) : null}
            </div>
          </Panel>
          <Panel title="İç not">
            <NoteForm orderId={order.id} defaultValue={order.adminNote ?? ""} />
          </Panel>
          {order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED" ? (
            <Panel title="Ücret iadesi kaydı">
              <RefundForm orderId={order.id} />
            </Panel>
          ) : null}
          <Panel title="Belgeler ve e-posta">
            <div className="flex flex-col items-start gap-2">
              {order.agreements.map((agreement) => (
                <AgreementButton key={agreement.kind} title={agreement.title} content={agreement.content} />
              ))}
              {order.paymentStatus === "PAID" ? (
                <form action={resendConfirmationAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <button type="submit" className="text-sm font-bold text-cocoa-700 underline">
                    Sipariş onay e-postasını yeniden gönder
                  </button>
                </form>
              ) : null}
            </div>
          </Panel>
          {order.returnRequests.length ? (
            <Panel title="İade / sorun talepleri">
              <ul className="space-y-2 text-sm">
                {order.returnRequests.map((request) => (
                  <li key={request.id}>
                    <Link href={`/yonetim/iadeler/${request.id}`} className="font-mono underline">{request.referenceNo}</Link> — {RETURN_STATUS_LABELS[request.status]}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
