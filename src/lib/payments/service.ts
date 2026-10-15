import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { InsufficientStockError, reserveStock } from "@/lib/inventory";
import { readableCode } from "@/lib/security/crypto";
import { getCardProviderId, paymentModeLabel } from "./config";
import { iyzicoInitiate, paytrInitiate } from "./providers";

export type PaymentPresentation =
  | { kind: "iframe"; src: string }
  | { kind: "redirect"; url: string }
  | { kind: "simulator"; url: string };

const REUSE_WINDOW_MS = 20 * 60_000;

function presentationFor(provider: string, payment: { reference: string; providerToken: string | null }): PaymentPresentation | null {
  if (provider === "paytr" && payment.providerToken) {
    return { kind: "iframe", src: `https://www.paytr.com/odeme/guvenli/${payment.providerToken}` };
  }
  if (provider === "mock") return { kind: "simulator", url: `/odeme/test/${payment.reference}` };
  return null;
}

/** Ödeme sayfası açıldığında, hâlâ geçerli bir ödeme oturumu varsa onu döndürür (yan etkisiz) */
export async function getReusablePresentation(orderId: string): Promise<PaymentPresentation | null> {
  const provider = getCardProviderId();
  if (!provider || provider === "iyzico") return null;
  const latest = await db.payment.findFirst({
    where: { orderId, provider, status: "INITIATED", createdAt: { gt: new Date(Date.now() - REUSE_WINDOW_MS) } },
    orderBy: { createdAt: "desc" },
  });
  return latest ? presentationFor(provider, latest) : null;
}

export type StartPaymentResult = { ok: true; presentation: PaymentPresentation } | { ok: false; message: string };

export async function startCardPayment(orderId: string, userIp: string): Promise<StartPaymentResult> {
  const provider = getCardProviderId();
  if (!provider) return { ok: false, message: "Kartla ödeme şu anda kullanılamıyor." };

  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.paymentMethod !== "CARD") return { ok: false, message: "Sipariş bulunamadı." };
  if (order.status !== "PENDING_PAYMENT") return { ok: false, message: "Bu sipariş için ödeme beklenmiyor." };
  const remainingMinutes = order.reservedUntil ? Math.floor((order.reservedUntil.getTime() - Date.now()) / 60_000) : 0;
  if (remainingMinutes < 3) {
    return { ok: false, message: "Bu siparişin ödeme süresi doldu. Ürünleri sepetinize yeniden ekleyerek yeni sipariş oluşturabilirsiniz." };
  }

  const reusable = await getReusablePresentation(order.id);
  if (reusable) return { ok: true, presentation: reusable };

  const reference = `${order.orderNumber}P${readableCode(4)}`;
  const payment = await db.payment.create({
    data: {
      orderId: order.id,
      provider,
      mode: paymentModeLabel(),
      status: "INITIATED",
      amountKurus: order.totalKurus,
      reference,
    },
  });

  if (provider === "mock") {
    await db.payment.update({ where: { id: payment.id }, data: { providerToken: "simulator" } });
    return { ok: true, presentation: { kind: "simulator", url: `/odeme/test/${reference}` } };
  }

  const result =
    provider === "paytr"
      ? await paytrInitiate(order, reference, userIp, Math.max(3, Math.min(30, remainingMinutes - 2)))
      : await iyzicoInitiate(order, reference, userIp);

  if (!result.ok) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", failureMessage: result.message } });
    return { ok: false, message: result.message };
  }
  await db.payment.update({ where: { id: payment.id }, data: { providerToken: result.token } });
  return {
    ok: true,
    presentation: result.kind === "iframe" ? { kind: "iframe", src: result.src } : { kind: "redirect", url: result.url },
  };
}

export type PaymentOutcome = {
  provider: string;
  reference: string;
  eventKey: string;
  status: "SUCCEEDED" | "FAILED";
  paidAmountKurus?: number | null;
  providerPaymentId?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
};

export type FinalizeResult = {
  result: "PROCESSED" | "DUPLICATE" | "NOT_FOUND" | "AMOUNT_MISMATCH";
  orderId?: string;
  orderNumber?: string;
  becamePaid?: boolean;
  productSlugs?: string[];
};

/**
 * Doğrulanmış bir ödeme bildirimini işler. Aynı bildirim tekrar gelirse (sağlayıcı yeniden denemeleri)
 * PaymentEvent tablosundaki benzersiz anahtar sayesinde ikinci kez işlenmez.
 */
export async function finalizePayment(outcome: PaymentOutcome): Promise<FinalizeResult> {
  try {
    return await db.$transaction(async (tx) => {
      const event = await tx.paymentEvent.create({
        data: {
          provider: outcome.provider,
          eventKey: outcome.eventKey.slice(0, 190),
          verified: true,
          outcome: "PROCESSED",
          summary: `${outcome.status}${outcome.failureMessage ? `: ${outcome.failureMessage}` : ""}`.slice(0, 300),
        },
      });
      const payment = await tx.payment.findUnique({
        where: { reference: outcome.reference },
        include: { order: { include: { items: true } } },
      });
      if (!payment || payment.provider !== outcome.provider) {
        await tx.paymentEvent.update({ where: { id: event.id }, data: { outcome: "IGNORED" } });
        return { result: "NOT_FOUND" as const };
      }
      await tx.paymentEvent.update({ where: { id: event.id }, data: { paymentId: payment.id } });
      const order = payment.order;
      const base = { orderId: order.id, orderNumber: order.orderNumber };

      if (payment.status === "SUCCEEDED" || payment.status === "FAILED") {
        await tx.paymentEvent.update({ where: { id: event.id }, data: { outcome: "DUPLICATE" } });
        return { result: "DUPLICATE" as const, ...base };
      }

      const now = new Date();
      const amountMismatch =
        outcome.status === "SUCCEEDED" &&
        outcome.paidAmountKurus !== undefined &&
        outcome.paidAmountKurus !== null &&
        outcome.paidAmountKurus < payment.amountKurus;
      const paymentData: Prisma.PaymentUpdateManyMutationInput =
        outcome.status === "FAILED"
          ? {
              status: "FAILED",
              failureCode: outcome.failureCode?.slice(0, 50) ?? null,
              failureMessage: outcome.failureMessage?.slice(0, 300) ?? "Ödeme tamamlanamadı.",
              completedAt: now,
            }
          : {
              status: "SUCCEEDED",
              paidAmountKurus: outcome.paidAmountKurus ?? payment.amountKurus,
              providerPaymentId: outcome.providerPaymentId ?? null,
              failureMessage: amountMismatch ? "Tahsil edilen tutar sipariş tutarından düşük — elle kontrol gerekli." : null,
              completedAt: now,
            };
      // Koşullu güncelleme: aynı ödeme için eşzamanlı iki farklı bildirim gelirse yalnızca biri işlenir
      const claimed = await tx.payment.updateMany({ where: { id: payment.id, status: { notIn: ["SUCCEEDED", "FAILED"] } }, data: paymentData });
      if (claimed.count === 0) {
        await tx.paymentEvent.update({ where: { id: event.id }, data: { outcome: "DUPLICATE" } });
        return { result: "DUPLICATE" as const, ...base };
      }

      if (outcome.status === "FAILED") {
        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: order.status,
            note: `Ödeme denemesi başarısız${outcome.failureMessage ? `: ${outcome.failureMessage.slice(0, 200)}` : "."}`,
            isCustomerVisible: false,
          },
        });
        return { result: "PROCESSED" as const, ...base, becamePaid: false };
      }

      // Başarılı ödeme: tutar kontrolü (taksit farkı nedeniyle tahsil edilen tutar daha yüksek olabilir)
      if (amountMismatch) {
        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: order.status,
            note: "DİKKAT: Ödeme tutarı sipariş tutarıyla uyuşmuyor. Sipariş ödendi olarak işaretlenmedi.",
            isCustomerVisible: false,
          },
        });
        return { result: "AMOUNT_MISMATCH" as const, ...base };
      }

      const duplicateCharge = async () => {
        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: order.status,
            note: `DİKKAT: Bu sipariş için ikinci bir başarılı ödeme alındı (${payment.reference}). Mükerrer tahsilatın iadesi gerekebilir.`,
            isCustomerVisible: false,
          },
        });
        return { result: "PROCESSED" as const, ...base, becamePaid: false };
      };
      if (order.paymentStatus === "PAID") return duplicateCharge();

      // Koşullu: aynı siparişin iki ayrı ödeme denemesi eşzamanlı başarılı olursa sipariş yalnızca bir kez "ödendi" işlenir
      const markedPaid = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: { not: "PAID" } },
        data: { status: "PAID", paymentStatus: "PAID", paidAt: now, reservedUntil: null, stockReleasedAt: null, paymentProvider: outcome.provider },
      });
      if (markedPaid.count === 0) return duplicateCharge();

      // Süresi dolmuş/iptal edilmiş siparişe gelen ödeme: stok yeniden ayrılmaya çalışılır.
      // Kısmen ayrılabilirse hareket kayıtları sayesinde iptalde yalnızca ayrılan miktar geri verilir.
      let stockNote: string | null = null;
      if (order.stockReleasedAt) {
        try {
          for (const item of order.items) {
            if (item.variantId) await reserveStock(tx, item.variantId, item.quantity, order.id);
          }
        } catch (error) {
          if (!(error instanceof InsufficientStockError)) throw error;
          stockNote = "DİKKAT: Ödeme, sipariş süresi dolduktan sonra alındı ve stok yetersiz. Elle kontrol edin.";
          await tx.order.update({ where: { id: order.id }, data: { stockReleasedAt: order.stockReleasedAt } });
        }
      }

      await tx.orderStatusEvent.create({
        data: { orderId: order.id, fromStatus: order.status, toStatus: "PAID", note: "Ödeme alındı." },
      });
      if (stockNote) {
        await tx.orderStatusEvent.create({
          data: { orderId: order.id, fromStatus: "PAID", toStatus: "PAID", note: stockNote, isCustomerVisible: false },
        });
      }
      const slugs = await tx.product.findMany({
        where: { id: { in: order.items.map((item) => item.productId).filter((id): id is string => Boolean(id)) } },
        select: { slug: true },
      });
      return { result: "PROCESSED" as const, ...base, becamePaid: true, productSlugs: slugs.map((s) => s.slug) };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { result: "DUPLICATE" };
    }
    throw error;
  }
}

/** Doğrulanamayan bildirimleri iz bırakmak için kaydeder */
export async function recordRejectedPaymentEvent(provider: string, summary: string) {
  await db.paymentEvent
    .create({
      data: { provider, eventKey: `rejected:${Date.now()}:${readableCode(6)}`, verified: false, outcome: "REJECTED", summary: summary.slice(0, 300) },
    })
    .catch(() => undefined);
}
