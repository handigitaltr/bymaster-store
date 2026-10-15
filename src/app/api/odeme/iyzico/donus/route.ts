import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { absoluteUrl, env } from "@/lib/env";
import { afterPaymentFinalized } from "@/lib/payments/after-payment";
import { decimalToKurus, iyzicoRetrieve } from "@/lib/payments/providers";
import { finalizePayment, recordRejectedPaymentEvent } from "@/lib/payments/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { getRequestIp } from "@/lib/security/request";

export const dynamic = "force-dynamic";

/**
 * iyzico Checkout Form geri dönüşü. Tarayıcıdan yalnızca "token" gelir; ödeme sonucu iyzico API'sinden
 * sunucu-sunucu sorgulanır (tarayıcı verisine güvenilmez) ve yanıt imzası doğrulanır.
 */
export async function POST(request: Request) {
  if (!env.IYZICO_API_KEY || !env.IYZICO_SECRET_KEY) return new NextResponse("Not found", { status: 404 });
  const limit = await rateLimit("paymentStart", getRequestIp(request));
  if (!limit.ok) return new NextResponse("Too many requests", { status: 429 });

  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  if (!/^[A-Za-z0-9-]{10,120}$/.test(token)) return new NextResponse("Bad request", { status: 400 });

  const payment = await db.payment.findFirst({ where: { provider: "iyzico", providerToken: token }, include: { order: { select: { orderNumber: true } } } });
  if (!payment) {
    await recordRejectedPaymentEvent("iyzico", "Bilinmeyen token ile geri dönüş");
    return NextResponse.redirect(absoluteUrl("/siparis-takip"), 303);
  }

  const redirectTo = (state: "tamam" | "hata" | "kontrol") =>
    NextResponse.redirect(absoluteUrl(`/siparis/${payment.order.orderNumber}?odeme=${state}`), 303);

  try {
    const { detail, signatureValid } = await iyzicoRetrieve(token, payment.reference);
    if (signatureValid === false) {
      // İmza doğrulanamadıysa ödeme kesinleştirilmez; yönetici iyzico panelinden kontrol eder
      await recordRejectedPaymentEvent("iyzico", `Yanıt imzası doğrulanamadı: ${payment.reference}`);
      return redirectTo("kontrol");
    }
    if (detail.status !== "success" || detail.conversationId !== payment.reference || detail.basketId !== payment.order.orderNumber) {
      const result = await finalizePayment({
        provider: "iyzico",
        reference: payment.reference,
        eventKey: `${token}:FAILURE:${detail.errorCode ?? "x"}`,
        status: "FAILED",
        failureCode: detail.errorCode ?? null,
        failureMessage: detail.errorMessage ?? "Ödeme onaylanmadı.",
      });
      await afterPaymentFinalized(result);
      return redirectTo("hata");
    }
    const succeeded = detail.paymentStatus === "SUCCESS" && (detail.fraudStatus === undefined || detail.fraudStatus === 1);
    if (detail.paymentStatus === "SUCCESS" && detail.fraudStatus === 0) {
      // Dolandırıcılık incelemesindeki ödemeler onaylanana kadar beklemede kalır
      await recordRejectedPaymentEvent("iyzico", `İncelemede (fraudStatus=0): ${payment.reference}`);
      return redirectTo("kontrol");
    }
    const result = await finalizePayment({
      provider: "iyzico",
      reference: payment.reference,
      eventKey: `${token}:${detail.paymentStatus}`,
      status: succeeded ? "SUCCEEDED" : "FAILED",
      paidAmountKurus: succeeded ? decimalToKurus(detail.paidPrice) : null,
      providerPaymentId: detail.paymentId ?? null,
      failureCode: succeeded ? null : (detail.errorCode ?? null),
      failureMessage: succeeded ? null : (detail.errorMessage ?? "Ödeme onaylanmadı."),
    });
    await afterPaymentFinalized(result);
    return redirectTo(succeeded ? "tamam" : "hata");
  } catch (error) {
    console.error("[iyzico] sonuç sorgulanamadı", error instanceof Error ? error.message : error);
    return redirectTo("kontrol");
  }
}
