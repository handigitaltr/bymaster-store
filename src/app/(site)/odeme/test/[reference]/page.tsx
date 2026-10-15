import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { formatTRY } from "@/lib/money";
import { canAccessOrder } from "@/lib/order-access";
import { getCardProviderId } from "@/lib/payments/config";
import { mockCallbackSignature } from "@/lib/payments/signatures";

export const metadata: Metadata = { title: "Test ödeme simülatörü", robots: { index: false, follow: false } };

type Props = { params: Promise<{ reference: string }> };

/**
 * YALNIZCA TEST MODU: Gerçek bir ödeme sağlayıcısı yokken uçtan uca sipariş akışını denemek için.
 * Sağlayıcının imzalı bildirimini taklit eder; ödeme alındı olarak işaretlenen siparişler "TEST" etiketlidir.
 */
export default async function PaymentSimulatorPage({ params }: Props) {
  if (getCardProviderId() !== "mock" || env.PAYMENT_MODE !== "test") notFound();
  const { reference } = await params;
  const payment = await db.payment.findUnique({ where: { reference }, include: { order: true } });
  const user = await getCurrentUser();
  if (!payment || payment.provider !== "mock" || !(await canAccessOrder(payment.order, user))) notFound();

  const sign = (status: string) => mockCallbackSignature(env.SESSION_SECRET, reference, status, payment.amountKurus);

  return (
    <div className="container-page max-w-xl py-16">
      <div className="rounded-[1.6rem] border-2 border-dashed border-bordeaux-500 bg-white p-8">
        <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-bordeaux-700">
          <FlaskConical className="size-5" aria-hidden="true" /> Test ödeme simülatörü
        </p>
        <h1 className="mt-3 font-display text-3xl text-cocoa-900">Gerçek tahsilat yapılmaz</h1>
        <p className="mt-3 text-sm text-cocoa-600">
          Sipariş <strong>{payment.order.orderNumber}</strong> · Tutar <strong className="tabular-nums">{formatTRY(payment.amountKurus)}</strong>
        </p>
        {payment.status !== "INITIATED" ? (
          <p className="mt-6 rounded-xl bg-cream-200 p-4 text-sm">Bu ödeme denemesi sonuçlanmış: {payment.status}</p>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { status: "success", label: "Başarılı ödeme gönder", className: "btn-primary" },
              { status: "failed", label: "Başarısız ödeme gönder", className: "btn-outline" },
            ].map((option) => (
              <form key={option.status} method="post" action="/api/odeme/test/bildirim">
                <input type="hidden" name="reference" value={reference} />
                <input type="hidden" name="status" value={option.status} />
                <input type="hidden" name="amount" value={payment.amountKurus} />
                <input type="hidden" name="signature" value={sign(option.status)} />
                <button type="submit" className={`btn btn-block ${option.className}`}>
                  {option.label}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
