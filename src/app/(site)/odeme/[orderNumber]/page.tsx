import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreditCard, FlaskConical, Lock } from "lucide-react";
import { startPaymentAction } from "@/app/actions/checkout";
import { PaytrFrame, ReservationCountdown } from "@/components/checkout/PaymentFrame";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { canAccessOrder } from "@/lib/order-access";
import { expireStaleOrders } from "@/lib/orders";
import { getCardProviderId, PROVIDER_LABELS } from "@/lib/payments/config";
import { getReusablePresentation } from "@/lib/payments/service";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ hata?: string }>;
};

export default async function PaymentPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { hata } = await searchParams;
  await expireStaleOrders();
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const user = await getCurrentUser();
  if (!order || !(await canAccessOrder(order, user))) notFound();
  if (order.paymentMethod !== "CARD" || order.status !== "PENDING_PAYMENT") redirect(`/siparis/${order.orderNumber}`);

  const provider = getCardProviderId();
  const presentation = await getReusablePresentation(order.id);
  const lastPayment = order.payments[0];

  return (
    <div className="container-page max-w-4xl pb-24 pt-10">
      <p className="eyebrow">Sipariş {order.orderNumber}</p>
      <h1 className="display-md mt-2 text-cocoa-900">Ödeme</h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-cocoa-600">
        <span>
          Ödenecek tutar: <strong className="text-lg tabular-nums text-cocoa-900">{formatTRY(order.totalKurus)}</strong>
        </span>
        {order.reservedUntil ? (
          <span>
            Ürünleriniz sizin için ayrıldı · kalan süre: <strong className="text-cocoa-900"><ReservationCountdown until={order.reservedUntil.toISOString()} /></strong>
          </span>
        ) : null}
      </div>

      <div className="mt-8 space-y-6">
        {hata === "baslatilamadi" ? (
          <Alert tone="error" title="Ödeme sayfası açılamadı">
            Ödeme sağlayıcısına şu anda ulaşılamıyor. Birkaç dakika sonra tekrar deneyebilirsiniz.
          </Alert>
        ) : null}
        {hata === "limit" ? <Alert tone="warning">Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.</Alert> : null}
        {lastPayment?.status === "FAILED" ? (
          <Alert tone="warning" title="Önceki ödeme denemesi tamamlanamadı">
            {lastPayment.failureMessage ?? "Ödeme onaylanmadı."} Kart bilgilerinizi kontrol ederek tekrar deneyebilirsiniz.
          </Alert>
        ) : null}

        {!provider ? (
          <Alert tone="error" title="Kartla ödeme şu anda kullanılamıyor">
            Lütfen <Link href="/iletisim">bizimle iletişime geçin</Link>.
          </Alert>
        ) : presentation?.kind === "iframe" ? (
          <PaytrFrame src={presentation.src} />
        ) : presentation?.kind === "simulator" ? (
          <div className="rounded-[1.4rem] border-2 border-dashed border-bordeaux-500 bg-bordeaux-50 p-6">
            <p className="flex items-center gap-2 font-bold text-bordeaux-700">
              <FlaskConical className="size-5" aria-hidden="true" /> Test modu — ödeme simülatörü
            </p>
            <p className="mt-2 text-sm text-bordeaux-700">
              Bu ortamda gerçek bir ödeme sağlayıcısı bağlı değildir. Simülatör, sağlayıcı bildirimini imzalı olarak taklit eder ve gerçek tahsilat yapmaz.
            </p>
            <Link href={presentation.url} className="btn btn-accent mt-4">
              Test ödeme sayfasını aç
            </Link>
          </div>
        ) : (
          <form action={startPaymentAction} className="rounded-[1.4rem] border border-cocoa-800/10 bg-cream-100 p-6">
            <input type="hidden" name="orderNumber" value={order.orderNumber} />
            <p className="flex items-center gap-2 font-bold text-cocoa-900">
              <CreditCard className="size-5" aria-hidden="true" /> {PROVIDER_LABELS[provider]} güvenli ödeme sayfası
            </p>
            <p className="mt-2 text-sm text-cocoa-600">Kart bilgileriniz ödeme kuruluşunun sayfasında girilir; sitemizde saklanmaz.</p>
            <SubmitButton variant="btn-accent" className="mt-4" pendingLabel="Yönlendiriliyor…">
              <Lock className="size-4" aria-hidden="true" /> {lastPayment ? "Ödemeyi tekrar dene" : "Ödemeye geç"}
            </SubmitButton>
          </form>
        )}

        <p className="text-sm text-cocoa-500">
          Ödeme tamamlandığında sipariş durumunuz otomatik olarak güncellenir.{" "}
          <Link href={`/siparis/${order.orderNumber}`} className="font-semibold text-bordeaux-600 underline">
            Sipariş detayına git
          </Link>
        </p>
      </div>
    </div>
  );
}
