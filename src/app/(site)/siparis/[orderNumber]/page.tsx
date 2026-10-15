import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, CreditCard, FlaskConical, Landmark, PackageCheck, Truck, XCircle } from "lucide-react";
import { AgreementButton, CopyButton, PaymentStatusPoller, ReorderButton, TrackPurchase } from "@/components/order/OrderClient";
import { Alert } from "@/components/ui/Alert";
import { getCurrentUser } from "@/lib/auth/guards";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, RETURN_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { canAccessOrder } from "@/lib/order-access";
import { expireStaleOrders, getOrderByNumber } from "@/lib/orders";
import { getSettings, parseBankAccounts } from "@/lib/settings";
import { formatDateTime, formatPhoneForDisplay } from "@/lib/text";
import { cx } from "@/lib/utils";

export const metadata: Metadata = { title: "Sipariş", robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ odeme?: string; talep?: string }>;
};

const TIMELINE: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function OrderPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { odeme, talep } = await searchParams;
  if (!/^BM[0-9A-Z]{8,14}$/.test(orderNumber)) notFound();
  await expireStaleOrders();
  const order = await getOrderByNumber(orderNumber);
  const user = await getCurrentUser();
  if (!order || !(await canAccessOrder(order, user))) notFound();

  const [settings, agreements] = await Promise.all([
    getSettings(),
    db.orderAgreement.findMany({ where: { orderId: order.id }, select: { kind: true, title: true, content: true } }),
  ]);
  const bankAccounts = parseBankAccounts(settings.bankAccountsJson);
  const status = order.status as OrderStatus;
  const lastPayment = order.payments[0];
  const isOwner = Boolean(user && order.userId === user.id);
  const canRequestSupport = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(status);

  const hero = (() => {
    switch (status) {
      case "PENDING_PAYMENT":
        return { icon: CreditCard, tone: "bg-cream-200", title: "Ödemeniz bekleniyor", text: "Siparişiniz oluşturuldu; ödeme tamamlandığında hazırlanmaya başlanacak." };
      case "AWAITING_TRANSFER":
        return { icon: Landmark, tone: "bg-cream-200", title: "Siparişiniz alındı — havale/EFT bekleniyor", text: "Ödemeniz hesabımıza ulaştığında siparişiniz hazırlanmaya başlanacak." };
      case "PAID":
      case "PROCESSING":
        return { icon: CheckCircle2, tone: "bg-[#eaf3ec]", title: "Teşekkürler, siparişiniz alındı", text: "Ödemeniz onaylandı. Siparişiniz hazırlanıyor." };
      case "SHIPPED":
        return { icon: Truck, tone: "bg-[#eaf3ec]", title: "Siparişiniz yolda", text: "Siparişiniz kargoya verildi." };
      case "DELIVERED":
        return { icon: PackageCheck, tone: "bg-[#eaf3ec]", title: "Siparişiniz teslim edildi", text: "Afiyet olsun! Sorularınız için bize ulaşabilirsiniz." };
      default:
        return {
          icon: XCircle,
          tone: "bg-bordeaux-50",
          title: status === "EXPIRED" ? "Siparişin ödeme süresi doldu" : "Sipariş iptal edildi",
          text: status === "EXPIRED" ? "Ödeme süresi içinde tamamlanmadığı için sipariş kapatıldı ve ürünler yeniden satışa açıldı." : "Bu sipariş iptal edildi.",
        };
    }
  })();
  const HeroIcon = hero.icon;
  const timelineIndex = TIMELINE.indexOf(status);

  return (
    <div className="container-page max-w-5xl pb-24 pt-10">
      {order.paymentStatus === "PAID" ? (
        <TrackPurchase
          orderNumber={order.orderNumber}
          totalKurus={order.totalKurus}
          items={order.items.map((item) => ({ id: item.variantId ?? item.sku, name: item.productName, priceKurus: item.unitPriceKurus, quantity: item.quantity }))}
        />
      ) : null}

      <div className={cx("rounded-[1.6rem] p-6 sm:p-8", hero.tone)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <HeroIcon className="mt-1 size-7 flex-none text-cocoa-800" aria-hidden="true" />
            <div>
              <p className="eyebrow">Sipariş {order.orderNumber}</p>
              <h1 className="mt-1 font-display text-3xl text-cocoa-900">{hero.title}</h1>
              <p className="mt-2 text-cocoa-700">{hero.text}</p>
            </div>
          </div>
          {order.isTest ? (
            <span className="pill bg-bordeaux-600 text-white">
              <FlaskConical className="size-3.5" aria-hidden="true" /> Test siparişi
            </span>
          ) : null}
        </div>

        {status === "PENDING_PAYMENT" ? (
          <div className="mt-5">
            {odeme === "tamam" ? <PaymentStatusPoller orderNumber={order.orderNumber} /> : null}
            {odeme === "hata" || lastPayment?.status === "FAILED" ? (
              <Alert tone="warning" className="mb-4">
                Ödeme tamamlanamadı{lastPayment?.failureMessage ? `: ${lastPayment.failureMessage}` : "."} Tekrar deneyebilirsiniz.
              </Alert>
            ) : null}
            {odeme === "kontrol" ? (
              <Alert tone="info" className="mb-4">
                Ödemeniz ödeme kuruluşu tarafından kontrol ediliyor. Sonuç netleştiğinde sipariş durumunuz güncellenecek.
              </Alert>
            ) : null}
            <Link href={`/odeme/${order.orderNumber}`} className="btn btn-accent">
              Ödeme sayfasına git
            </Link>
          </div>
        ) : null}

        {timelineIndex >= 0 ? (
          <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Sipariş adımları">
            {TIMELINE.map((step, index) => (
              <li key={step} className="text-center">
                <span className={cx("mx-auto block h-1.5 rounded-full", index <= timelineIndex ? "bg-cocoa-800" : "bg-cocoa-800/15")} />
                <span className={cx("mt-2 block text-xs font-bold", index <= timelineIndex ? "text-cocoa-900" : "text-cocoa-400")}>
                  {ORDER_STATUS_LABELS[step]}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      {talep && /^TLP-[A-Z0-9]{6}$/.test(talep) ? (
        <Alert tone="success" title="Talebiniz alındı" className="mt-6">
          Referans numaranız {talep}. Talebiniz incelenerek size e-posta ile dönüş yapılacak.
        </Alert>
      ) : null}

      {status === "AWAITING_TRANSFER" ? (
        <section className="mt-8 rounded-[1.4rem] border border-cocoa-800/10 p-6" aria-labelledby="havale">
          <h2 id="havale" className="font-display text-2xl text-cocoa-900">
            Havale / EFT bilgileri
          </h2>
          <p className="mt-2 text-sm text-cocoa-600">
            <strong className="tabular-nums">{formatTRY(order.totalKurus)}</strong> tutarındaki ödemeyi aşağıdaki hesaba gönderin ve açıklama
            alanına sipariş numaranızı (<strong>{order.orderNumber}</strong>) yazın.
            {order.reservedUntil ? ` Son ödeme zamanı: ${formatDateTime(order.reservedUntil)}.` : ""}
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {bankAccounts.map((account) => (
              <li key={account.iban} className="rounded-xl bg-cream-200 p-4 text-sm">
                <p className="font-bold text-cocoa-900">{account.bankName}</p>
                <p className="mt-1 text-cocoa-600">Alıcı: {account.accountHolder}</p>
                <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[0.85rem] text-cocoa-900">
                  {account.iban} <CopyButton value={account.iban.replace(/\s/g, "")} label="IBAN" />
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-2 text-xs text-cocoa-500">
            <Clock className="size-3.5" aria-hidden="true" /> Ödemeniz kontrol edildikten sonra sipariş durumunuz “Ödeme alındı” olarak güncellenir.
          </p>
        </section>
      ) : null}

      {order.trackingNumber ? (
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[1.4rem] border border-cocoa-800/10 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Kargo takibi</p>
            <p className="mt-1 font-bold text-cocoa-900">
              {order.shippingCarrier ?? "Kargo"} · <span className="font-mono">{order.trackingNumber}</span>
            </p>
          </div>
          {order.trackingUrl ? (
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
              Kargoyu takip et
            </a>
          ) : null}
        </section>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-labelledby="urunler">
          <h2 id="urunler" className="font-display text-2xl text-cocoa-900">
            Ürünler
          </h2>
          <ul className="mt-4 divide-y divide-cocoa-800/10 border-y border-cocoa-800/10">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <span className="relative size-16 flex-none overflow-hidden rounded-xl bg-cream-200">
                  {item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-cocoa-900">{item.productName}</span>
                  <span className="block text-sm text-cocoa-500">
                    {item.variantName} · {item.quantity} × {formatTRY(item.unitPriceKurus)}
                  </span>
                </span>
                <span className="font-bold tabular-nums">{formatTRY(item.lineTotalKurus)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-cocoa-600">Ara toplam</dt>
              <dd className="tabular-nums">{formatTRY(order.subtotalKurus)}</dd>
            </div>
            {order.discountKurus > 0 ? (
              <div className="flex justify-between text-success">
                <dt>İndirim{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                <dd className="tabular-nums">−{formatTRY(order.discountKurus)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-cocoa-600">Kargo</dt>
              <dd className="tabular-nums">{order.shippingKurus === 0 ? "Ücretsiz" : formatTRY(order.shippingKurus)}</dd>
            </div>
            <div className="flex justify-between border-t border-cocoa-800/12 pt-2 text-base font-extrabold">
              <dt>Toplam</dt>
              <dd className="tabular-nums">{formatTRY(order.totalKurus)}</dd>
            </div>
            <div className="flex justify-between text-xs text-cocoa-500">
              <dt>Toplama dahil KDV</dt>
              <dd className="tabular-nums">{formatTRY(order.vatKurus)}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            {isOwner || status === "CANCELLED" || status === "EXPIRED" || status === "DELIVERED" ? <ReorderButton orderId={order.id} /> : null}
            {canRequestSupport ? (
              <Link href={`/siparis/${order.orderNumber}/talep`} className="btn btn-outline">
                Sorun bildir / iade talebi
              </Link>
            ) : null}
          </div>
          {order.returnRequests.length > 0 ? (
            <div className="mt-6 rounded-xl bg-cream-200 p-4 text-sm">
              <p className="font-bold text-cocoa-900">Talepleriniz</p>
              <ul className="mt-2 space-y-1">
                {order.returnRequests.map((request) => (
                  <li key={request.id}>
                    {request.referenceNo} — {RETURN_STATUS_LABELS[request.status] ?? request.status}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6 lg:col-span-5">
          <div className="rounded-[1.4rem] bg-cream-100 p-6 text-sm">
            <h2 className="font-display text-xl text-cocoa-900">Teslimat</h2>
            <p className="mt-3 font-bold text-cocoa-900">{order.shipFullName}</p>
            <p className="text-cocoa-600">{formatPhoneForDisplay(order.shipPhone)}</p>
            <p className="mt-1 text-cocoa-600">
              {order.shipAddressLine}, {order.shipDistrict} / {order.shipCity}
            </p>
            <h2 className="mt-6 font-display text-xl text-cocoa-900">Fatura</h2>
            {order.billType === "CORPORATE" ? (
              <p className="mt-3 text-cocoa-600">
                <strong className="text-cocoa-900">{order.billCompanyName}</strong>
                <br />
                {order.billTaxOffice} V.D. · {order.billTaxNumber}
              </p>
            ) : (
              <p className="mt-3 font-bold text-cocoa-900">{order.billFullName}</p>
            )}
            <p className="mt-1 text-cocoa-600">
              {order.billAddressLine}, {order.billDistrict} / {order.billCity}
            </p>
            <h2 className="mt-6 font-display text-xl text-cocoa-900">Ödeme</h2>
            <p className="mt-3 text-cocoa-600">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
          </div>

          <div className="rounded-[1.4rem] border border-cocoa-800/10 p-6">
            <h2 className="font-display text-xl text-cocoa-900">Sipariş geçmişi</h2>
            <ol className="mt-4 space-y-3">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 flex-none rounded-full bg-caramel-500" aria-hidden="true" />
                  <span>
                    <span className="block font-bold text-cocoa-900">{ORDER_STATUS_LABELS[event.toStatus as OrderStatus] ?? event.toStatus}</span>
                    {event.note ? <span className="block text-cocoa-600">{event.note}</span> : null}
                    <span className="block text-xs text-cocoa-400">{formatDateTime(event.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {agreements.length > 0 ? (
            <div className="space-y-2 rounded-[1.4rem] border border-cocoa-800/10 p-6">
              <h2 className="font-display text-xl text-cocoa-900">Onaylanan sözleşmeler</h2>
              <p className="text-xs text-cocoa-500">{formatDateTime(order.agreementsAcceptedAt)} tarihinde onaylandı.</p>
              <div className="flex flex-col items-start gap-1.5 pt-1">
                {agreements.map((agreement) => (
                  <AgreementButton key={agreement.kind} title={agreement.title} content={agreement.content} />
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
