import { NextResponse } from "next/server";
import { absoluteUrl, env } from "@/lib/env";
import { safeEqual } from "@/lib/security/crypto";
import { getCardProviderId } from "@/lib/payments/config";
import { afterPaymentFinalized } from "@/lib/payments/after-payment";
import { finalizePayment, recordRejectedPaymentEvent } from "@/lib/payments/service";
import { mockCallbackSignature } from "@/lib/payments/signatures";

export const dynamic = "force-dynamic";

/** Test simülatörü bildirimi — gerçek sağlayıcılarla aynı doğrulama ve işleme yolunu kullanır */
export async function POST(request: Request) {
  if (getCardProviderId() !== "mock" || env.PAYMENT_MODE !== "test") {
    return new NextResponse("Not found", { status: 404 });
  }
  const form = await request.formData();
  const reference = String(form.get("reference") ?? "");
  const status = String(form.get("status") ?? "");
  const amount = Number(form.get("amount") ?? NaN);
  const signature = String(form.get("signature") ?? "");

  if (!reference || !["success", "failed"].includes(status) || !Number.isInteger(amount)) {
    return new NextResponse("Bad request", { status: 400 });
  }
  const expected = mockCallbackSignature(env.SESSION_SECRET, reference, status, amount);
  if (!safeEqual(expected, signature)) {
    await recordRejectedPaymentEvent("mock", `Geçersiz imza: ${reference}`);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const result = await finalizePayment({
    provider: "mock",
    reference,
    eventKey: `${reference}:${status}`,
    status: status === "success" ? "SUCCEEDED" : "FAILED",
    paidAmountKurus: status === "success" ? amount : null,
    providerPaymentId: status === "success" ? `TEST-${reference}` : null,
    failureMessage: status === "failed" ? "Test: kart reddedildi." : null,
  });
  await afterPaymentFinalized(result);

  if (!result.orderNumber) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(absoluteUrl(`/siparis/${result.orderNumber}?odeme=${status === "success" ? "tamam" : "hata"}`), 303);
}
