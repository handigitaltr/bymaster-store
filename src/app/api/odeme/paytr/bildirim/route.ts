import { env } from "@/lib/env";
import { safeEqual } from "@/lib/security/crypto";
import { afterPaymentFinalized } from "@/lib/payments/after-payment";
import { finalizePayment, recordRejectedPaymentEvent } from "@/lib/payments/service";
import { paytrCallbackHash } from "@/lib/payments/signatures";

export const dynamic = "force-dynamic";

/**
 * PayTR Bildirim URL'i (PayTR Mağaza Paneli > Ayarlar'da tanımlanır).
 * İstek PayTR sunucularından gelir; hash doğrulanmadan hiçbir işlem yapılmaz.
 * PayTR, düz metin "OK" yanıtı alana kadar bildirimi tekrarlar; işlem idempotenttir.
 */
export async function POST(request: Request) {
  if (!env.PAYTR_MERCHANT_KEY || !env.PAYTR_MERCHANT_SALT) return new Response("not configured", { status: 404 });

  const form = await request.formData();
  const merchantOid = String(form.get("merchant_oid") ?? "");
  const status = String(form.get("status") ?? "");
  const totalAmount = String(form.get("total_amount") ?? "");
  const hash = String(form.get("hash") ?? "");

  if (!merchantOid || !status || !totalAmount || !hash || !/^[A-Za-z0-9]{1,64}$/.test(merchantOid)) {
    return new Response("PAYTR notification failed: missing fields", { status: 400 });
  }
  const expected = paytrCallbackHash(merchantOid, status, totalAmount, env.PAYTR_MERCHANT_KEY, env.PAYTR_MERCHANT_SALT);
  if (!safeEqual(expected, hash)) {
    await recordRejectedPaymentEvent("paytr", `Geçersiz hash: ${merchantOid}`);
    return new Response("PAYTR notification failed: bad hash", { status: 400 });
  }

  const paid = status === "success";
  const result = await finalizePayment({
    provider: "paytr",
    reference: merchantOid,
    eventKey: `${merchantOid}:${status}:${totalAmount}`,
    status: paid ? "SUCCEEDED" : "FAILED",
    paidAmountKurus: paid ? Number.parseInt(totalAmount, 10) : null,
    providerPaymentId: paid ? merchantOid : null,
    failureCode: paid ? null : String(form.get("failed_reason_code") ?? "") || null,
    failureMessage: paid ? null : String(form.get("failed_reason_msg") ?? "") || "Ödeme onaylanmadı.",
  });
  await afterPaymentFinalized(result);

  // Bilinmeyen sipariş dahil tüm doğrulanmış bildirimlere OK dönülür (aksi halde PayTR sürekli tekrar dener)
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
