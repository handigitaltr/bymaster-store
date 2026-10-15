import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clearCart, findCurrentCart, priceCart } from "@/lib/cart";
import {
  ORDER_STATUS_LABELS,
  ORDER_TRANSITIONS,
  PAYMENT_METHOD_LABELS,
  UNPAID_OPEN_STATUSES,
  type OrderStatus,
} from "@/lib/constants";
import { absoluteUrl, appUrl, isTestPaymentMode } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import {
  adminNewOrderEmail,
  bankTransferEmail,
  orderCancelledEmail,
  orderPaidEmail,
  orderShippedEmail,
} from "@/lib/email/templates";
import { InsufficientStockError, releaseOrderStock, reserveStock } from "@/lib/inventory";
import { orderVars, renderTemplate, sellerVars } from "@/lib/legal";
import { getCardProviderId } from "@/lib/payments/config";
import { readableCode } from "@/lib/security/crypto";
import { LEGAL_PAGE_SLUGS, getSettings, missingSellerFields, parseBankAccounts } from "@/lib/settings";

export type CheckoutData = {
  email: string;
  phone: string;
  fullName: string;
  shipping: {
    fullName: string;
    phone: string;
    city: string;
    district: string;
    addressLine: string;
    postalCode: string | null;
  };
  billing: {
    type: "INDIVIDUAL" | "CORPORATE";
    fullName: string;
    city: string;
    district: string;
    addressLine: string;
    companyName: string | null;
    taxOffice: string | null;
    taxNumber: string | null;
  };
  paymentMethod: "CARD" | "BANK_TRANSFER";
  note: string | null;
  marketingConsent: boolean;
  expectedTotalKurus: number;
  idempotencyKey: string;
};

export type PlaceOrderResult =
  | { ok: true; orderId: string; orderNumber: string; paymentMethod: string; productSlugs: string[] }
  | {
      ok: false;
      code: "EMPTY" | "PROBLEMS" | "PRICE_CHANGED" | "NOT_READY" | "PAYMENT_UNAVAILABLE" | "OUT_OF_STOCK" | "COUPON" | "DUPLICATE";
      message: string;
    };

class CouponExhaustedError extends Error {}

/** Siparişlerin alınabilmesi için gereken yapılandırmalar */
export async function getCheckoutReadiness() {
  const settings = await getSettings();
  const legalPages = await db.page.findMany({
    where: { slug: { in: [LEGAL_PAGE_SLUGS.preInformation, LEGAL_PAGE_SLUGS.distanceSales] }, status: "PUBLISHED" },
    select: { slug: true, title: true, content: true },
  });
  const problems: string[] = [];
  const missingSeller = missingSellerFields(settings);
  if (missingSeller.length) problems.push(`Satıcı bilgileri eksik (${missingSeller.join(", ")})`);
  const preInformation = legalPages.find((page) => page.slug === LEGAL_PAGE_SLUGS.preInformation) ?? null;
  const distanceSales = legalPages.find((page) => page.slug === LEGAL_PAGE_SLUGS.distanceSales) ?? null;
  if (!preInformation) problems.push("Ön Bilgilendirme Formu yayınlanmadı");
  if (!distanceSales) problems.push("Mesafeli Satış Sözleşmesi yayınlanmadı");
  const cardProvider = getCardProviderId();
  const bankAccounts = settings.bankTransferEnabled ? parseBankAccounts(settings.bankAccountsJson) : [];
  if (!cardProvider && bankAccounts.length === 0) problems.push("Ödeme yöntemi yapılandırılmadı");
  return {
    ready: problems.length === 0,
    problems,
    settings,
    cardProvider,
    bankAccounts,
    seller: sellerVars(settings, appUrl),
    legal: { preInformation, distanceSales },
  };
}

function istanbulDateCode(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "2-digit", month: "2-digit", day: "2-digit" })
    .format(date)
    .replace(/-/g, "");
}

async function generateOrderNumber(): Promise<string> {
  const dateCode = istanbulDateCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `BM${dateCode}${readableCode(4)}`;
    const exists = await db.order.findUnique({ where: { orderNumber: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  return `BM${dateCode}${readableCode(7)}`;
}

function formatAddress(address: { fullName: string; addressLine: string; district: string; city: string; postalCode?: string | null }) {
  return `${address.fullName}, ${address.addressLine}, ${address.district} / ${address.city}${address.postalCode ? ` ${address.postalCode}` : ""}`;
}

export function billingSummary(billing: CheckoutData["billing"]): string {
  return billing.type === "CORPORATE"
    ? `${billing.companyName ?? ""} — Vergi dairesi: ${billing.taxOffice ?? "-"}, Vergi no: ${billing.taxNumber ?? "-"} — ${billing.addressLine}, ${billing.district} / ${billing.city}`
    : `${billing.fullName} — ${billing.addressLine}, ${billing.district} / ${billing.city}`;
}

export async function placeOrder(data: CheckoutData, user: CurrentUser | null): Promise<PlaceOrderResult> {
  // Aynı formun tekrar gönderilmesi: yeni sipariş oluşturmadan mevcut siparişe yönlendir
  const existing = await db.order.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
    select: { id: true, orderNumber: true, paymentMethod: true, email: true },
  });
  if (existing) {
    if (existing.email !== data.email) {
      return { ok: false, code: "DUPLICATE", message: "Bu form daha önce gönderildi. Lütfen sayfayı yenileyin." };
    }
    return { ok: true, orderId: existing.id, orderNumber: existing.orderNumber, paymentMethod: existing.paymentMethod, productSlugs: [] };
  }

  await expireStaleOrders();

  const cart = await findCurrentCart(user);
  const priced = await priceCart(cart, { user, email: data.email });
  if (!cart || priced.lines.length === 0) return { ok: false, code: "EMPTY", message: "Sepetiniz boş." };
  if (priced.problems.length) {
    return { ok: false, code: "PROBLEMS", message: "Sepetinizdeki bazı ürünlerde değişiklik var. Lütfen sepetinizi kontrol edin." };
  }
  if (priced.couponCode && !priced.couponApplied) {
    return { ok: false, code: "COUPON", message: priced.couponMessage ?? "İndirim kodu artık geçerli değil." };
  }
  if (priced.totals.shippingStatus === "NOT_CONFIGURED") {
    return { ok: false, code: "NOT_READY", message: "Kargo ücretleri henüz tanımlanmadığı için sipariş alınamıyor." };
  }
  if (priced.totals.totalKurus !== data.expectedTotalKurus) {
    return {
      ok: false,
      code: "PRICE_CHANGED",
      message: "Sepet tutarınız güncellendi (fiyat, stok veya kampanya değişikliği). Lütfen yeni tutarı kontrol edip tekrar onaylayın.",
    };
  }

  const readiness = await getCheckoutReadiness();
  if (!readiness.ready || !readiness.legal.preInformation || !readiness.legal.distanceSales) {
    return { ok: false, code: "NOT_READY", message: "Online sipariş şu anda alınamıyor. Lütfen daha sonra tekrar deneyin." };
  }
  if (data.paymentMethod === "CARD" && !readiness.cardProvider) {
    return { ok: false, code: "PAYMENT_UNAVAILABLE", message: "Kartla ödeme şu anda kullanılamıyor." };
  }
  if (data.paymentMethod === "BANK_TRANSFER" && readiness.bankAccounts.length === 0) {
    return { ok: false, code: "PAYMENT_UNAVAILABLE", message: "Havale/EFT ile ödeme şu anda kullanılamıyor." };
  }

  const settings = readiness.settings;
  const now = new Date();
  const reservedUntil = new Date(
    now.getTime() +
      (data.paymentMethod === "CARD"
        ? settings.paymentReservationMinutes * 60_000
        : settings.bankTransferHoldHours * 3_600_000),
  );
  const status: OrderStatus = data.paymentMethod === "CARD" ? "PENDING_PAYMENT" : "AWAITING_TRANSFER";
  const orderNumber = await generateOrderNumber();
  const lines = priced.lines;
  const totals = priced.totals;

  const vars = {
    ...readiness.seller,
    ...orderVars({
      buyerName: data.fullName,
      buyerEmail: data.email,
      buyerPhone: data.phone,
      shippingAddress: formatAddress(data.shipping),
      billingSummary: billingSummary(data.billing),
      paymentMethodLabel: PAYMENT_METHOD_LABELS[data.paymentMethod],
      items: lines.map((line) => ({
        name: `${line.productName} — ${line.variantName}`,
        quantity: line.quantity,
        unitPriceKurus: line.unitPriceKurus,
        lineTotalKurus: line.lineTotalKurus,
      })),
      subtotalKurus: totals.subtotalKurus,
      discountKurus: totals.discountKurus,
      shippingKurus: totals.shippingKurus,
      totalKurus: totals.totalKurus,
      date: now,
      orderNumber,
    }),
  };

  let order: { id: string; orderNumber: string };
  try {
    order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id ?? null,
          status,
          paymentStatus: "UNPAID",
          paymentMethod: data.paymentMethod,
          paymentProvider: data.paymentMethod === "CARD" ? readiness.cardProvider : "bank_transfer",
          isTest: data.paymentMethod === "CARD" && isTestPaymentMode,
          email: data.email,
          phone: data.phone,
          customerName: data.fullName,
          shipFullName: data.shipping.fullName,
          shipPhone: data.shipping.phone,
          shipCity: data.shipping.city,
          shipDistrict: data.shipping.district,
          shipAddressLine: data.shipping.addressLine,
          shipPostalCode: data.shipping.postalCode,
          billType: data.billing.type,
          billFullName: data.billing.fullName,
          billCity: data.billing.city,
          billDistrict: data.billing.district,
          billAddressLine: data.billing.addressLine,
          billCompanyName: data.billing.companyName,
          billTaxOffice: data.billing.taxOffice,
          billTaxNumber: data.billing.taxNumber,
          customerNote: data.note,
          subtotalKurus: totals.subtotalKurus,
          discountKurus: totals.discountKurus,
          shippingKurus: totals.shippingKurus,
          vatKurus: totals.vatKurus,
          totalKurus: totals.totalKurus,
          couponId: priced.couponApplied ? priced.couponId : null,
          couponCode: priced.couponApplied ? priced.couponCode : null,
          idempotencyKey: data.idempotencyKey,
          reservedUntil,
          marketingConsent: data.marketingConsent,
          agreementsAcceptedAt: now,
          items: {
            create: lines.map((line, index) => ({
              productId: line.productId,
              variantId: line.variantId,
              productName: line.productName,
              variantName: line.variantName,
              sku: line.sku,
              imageUrl: line.imageIsPlaceholder ? null : line.imageUrl,
              packageType: line.packageType,
              unitPriceKurus: line.unitPriceKurus,
              vatRate: line.vatRate,
              quantity: line.quantity,
              lineTotalKurus: line.lineTotalKurus,
              discountKurus: totals.lineDiscounts[index] ?? 0,
            })),
          },
          events: { create: { toStatus: status, note: "Sipariş oluşturuldu." } },
          agreements: {
            create: [
              {
                kind: "PRE_INFORMATION",
                title: readiness.legal.preInformation!.title,
                content: renderTemplate(readiness.legal.preInformation!.content, vars),
              },
              {
                kind: "DISTANCE_SALES",
                title: readiness.legal.distanceSales!.title,
                content: renderTemplate(readiness.legal.distanceSales!.content, vars),
              },
            ],
          },
        },
        select: { id: true, orderNumber: true },
      });

      for (const line of lines) await reserveStock(tx, line.variantId, line.quantity, created.id);

      if (priced.couponApplied && priced.couponId) {
        // Kullanım limiti atomik olarak kontrol edilir (eşzamanlı siparişlerde limit aşılamaz)
        const updated = await tx.$executeRaw`
          UPDATE "Coupon" SET "usedCount" = "usedCount" + 1
          WHERE "id" = ${priced.couponId} AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`;
        if (updated === 0) throw new CouponExhaustedError();
        await tx.couponRedemption.create({ data: { couponId: priced.couponId, orderId: created.id, email: data.email } });
      }
      return created;
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return { ok: false, code: "OUT_OF_STOCK", message: "Sepetinizdeki bir ürünün stoğu siz alışveriş yaparken tükendi. Lütfen sepetinizi kontrol edin." };
    }
    if (error instanceof CouponExhaustedError) {
      return { ok: false, code: "COUPON", message: "İndirim kodunun kullanım limiti doldu. Kodu kaldırıp tekrar deneyin." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const again = await db.order.findUnique({ where: { idempotencyKey: data.idempotencyKey }, select: { id: true, orderNumber: true, paymentMethod: true } });
      if (again) return { ok: true, orderId: again.id, orderNumber: again.orderNumber, paymentMethod: again.paymentMethod, productSlugs: [] };
    }
    throw error;
  }

  await clearCart(cart.id);

  if (user && data.marketingConsent && !user.marketingConsent) {
    await db.user.update({ where: { id: user.id }, data: { marketingConsent: true, marketingConsentAt: now } });
  }

  if (data.paymentMethod === "BANK_TRANSFER") {
    const full = await loadOrderForEmail(order.id);
    if (full) {
      await sendEmail(
        data.email,
        bankTransferEmail(full, readiness.bankAccounts, settings.bankTransferHoldHours, absoluteUrl(`/siparis/${order.orderNumber}`), settings.storeName),
        "bank-transfer",
      );
      await notifyAdminOfOrder(order.id);
    }
  }

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentMethod: data.paymentMethod,
    productSlugs: lines.map((line) => line.slug),
  };
}

export async function loadOrderForEmail(orderId: string) {
  return db.order.findUnique({ where: { id: orderId }, include: { items: true } });
}

export async function notifyAdminOfOrder(orderId: string) {
  const settings = await getSettings();
  if (!settings.orderNotificationEmail) return;
  const order = await loadOrderForEmail(orderId);
  if (!order) return;
  await sendEmail(
    settings.orderNotificationEmail,
    adminNewOrderEmail(
      { ...order, paymentLabel: PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod },
      absoluteUrl(`/yonetim/siparisler/${order.id}`),
      settings.storeName,
    ),
    "admin-new-order",
  );
}

export async function sendOrderPaidEmails(orderId: string) {
  const settings = await getSettings();
  const order = await loadOrderForEmail(orderId);
  if (!order) return;
  await sendEmail(order.email, orderPaidEmail(order, absoluteUrl(`/siparis/${order.orderNumber}`), settings.storeName), "order-paid");
  await notifyAdminOfOrder(orderId);
}

/**
 * Sipariş iptali / süre aşımı: durum koşullu güncellenir, rezerve stok hareket kayıtlarına göre iade edilir,
 * ödenmemiş siparişlerde kupon kullanımı geri alınır. Birden çok kez çağrılması güvenlidir.
 */
export async function releaseOrder(orderId: string, toStatus: "EXPIRED" | "CANCELLED", note: string, actorId: string | null) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) return false;
    const allowedFrom: string[] =
      toStatus === "EXPIRED" ? UNPAID_OPEN_STATUSES : ["PENDING_PAYMENT", "AWAITING_TRANSFER", "PAID", "PROCESSING"];
    if (!allowedFrom.includes(order.status)) return false;
    const now = new Date();
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status: toStatus,
        stockReleasedAt: now,
        cancelledAt: toStatus === "CANCELLED" ? now : order.cancelledAt,
      },
    });
    if (updated.count === 0) return false;
    await releaseOrderStock(tx, orderId, note, actorId);
    if (order.couponId && order.paymentStatus !== "PAID") {
      const redemption = await tx.couponRedemption.findUnique({ where: { orderId } });
      if (redemption) {
        await tx.couponRedemption.delete({ where: { orderId } });
        await tx.coupon.updateMany({ where: { id: order.couponId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
      }
    }
    await tx.payment.updateMany({ where: { orderId, status: "INITIATED" }, data: { status: "CANCELLED" } });
    await tx.orderStatusEvent.create({ data: { orderId, fromStatus: order.status, toStatus, note, actorId } });
    return true;
  });
}

let lastSweep = 0;

/** Ödeme süresi dolan siparişleri kapatır (sipariş/ödeme/yönetim sayfalarında tembel olarak çağrılır) */
export async function expireStaleOrders(force = false) {
  if (!force && Date.now() - lastSweep < 20_000) return 0;
  lastSweep = Date.now();
  const stale = await db.order.findMany({
    where: { status: { in: UNPAID_OPEN_STATUSES }, reservedUntil: { lt: new Date() } },
    select: { id: true },
    take: 100,
  });
  let count = 0;
  for (const { id } of stale) {
    const released = await releaseOrder(id, "EXPIRED", "Ödeme süresi içinde tamamlanmadığı için sipariş kapatıldı; ürünler yeniden satışa açıldı.", null);
    if (released) count++;
  }
  return count;
}

export type TransitionOptions = {
  actorId: string;
  note?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  notifyCustomer?: boolean;
};

/** Yönetici durum geçişi (izin verilen geçişler ORDER_TRANSITIONS ile sınırlıdır) */
export async function transitionOrder(orderId: string, to: OrderStatus, options: TransitionOptions) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false as const, message: "Sipariş bulunamadı." };
  const from = order.status as OrderStatus;
  if (!ORDER_TRANSITIONS[from]?.includes(to)) {
    return { ok: false as const, message: `"${ORDER_STATUS_LABELS[from]}" durumundan "${ORDER_STATUS_LABELS[to]}" durumuna geçilemez.` };
  }
  const settings = await getSettings();
  const note = options.note?.trim() || null;

  if (to === "CANCELLED") {
    const released = await releaseOrder(orderId, "CANCELLED", note ?? "Sipariş yönetici tarafından iptal edildi.", options.actorId);
    if (!released) return { ok: false as const, message: "Sipariş iptal edilemedi (durum değişmiş olabilir)." };
    await audit(options.actorId, "order.cancel", "Order", orderId, note ?? undefined);
    if (options.notifyCustomer !== false) {
      const full = await loadOrderForEmail(orderId);
      if (full)
        await sendEmail(
          full.email,
          orderCancelledEmail(full, order.paymentStatus === "PAID" ? "Ödemenizin iadesi için sizinle iletişime geçeceğiz." : "Sorularınız için bizimle iletişime geçebilirsiniz.", settings.storeName),
          "order-cancelled",
        );
    }
    return { ok: true as const };
  }

  if (to === "PAID" && !note) {
    return { ok: false as const, message: "Ödemeyi elle onaylarken açıklama (ör. havale referansı) girilmelidir." };
  }
  if (to === "SHIPPED" && !options.trackingNumber?.trim()) {
    return { ok: false as const, message: "Kargoya verildi durumu için takip numarası zorunludur." };
  }

  const now = new Date();
  const updated = await db.order.updateMany({
    where: { id: orderId, status: from },
    data: {
      status: to,
      ...(to === "PAID" ? { paymentStatus: "PAID", paidAt: now, reservedUntil: null } : {}),
      ...(to === "SHIPPED"
        ? {
            shippedAt: now,
            shippingCarrier: options.shippingCarrier?.trim() || null,
            trackingNumber: options.trackingNumber?.trim() || null,
            trackingUrl: options.trackingUrl?.trim() || null,
          }
        : {}),
      ...(to === "DELIVERED" ? { deliveredAt: now } : {}),
    },
  });
  if (updated.count === 0) return { ok: false as const, message: "Sipariş durumu bu sırada değişti. Sayfayı yenileyin." };
  await db.orderStatusEvent.create({ data: { orderId, fromStatus: from, toStatus: to, note, actorId: options.actorId } });
  await audit(options.actorId, `order.status.${to.toLowerCase()}`, "Order", orderId, note ?? undefined);

  if (options.notifyCustomer !== false) {
    const full = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (full) {
      if (to === "PAID") await sendOrderPaidEmails(orderId);
      if (to === "SHIPPED")
        await sendEmail(full.email, orderShippedEmail(full, absoluteUrl(`/siparis/${full.orderNumber}`), settings.storeName), "order-shipped");
    }
  }
  return { ok: true as const };
}

export async function getOrderByNumber(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      events: { where: { isCustomerVisible: true }, orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      returnRequests: { orderBy: { createdAt: "desc" } },
    },
  });
}
