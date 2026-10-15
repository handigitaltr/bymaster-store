import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { InsufficientStockError, releaseOrderStock, reserveStock } from "@/lib/inventory";
import { finalizePayment } from "@/lib/payments/service";

// Gerçek bir SQLite test veritabanında (prisma/vitest.db) ödeme sonuçlandırma ve stok ayırma kuralları

let seq = 0;

async function createVariant(stock: number, trackStock = true) {
  seq++;
  const category = await db.category.upsert({ where: { slug: "test-kategori" }, update: {}, create: { slug: "test-kategori", name: "Test" } });
  const product = await db.product.create({
    data: { slug: `test-urun-${seq}`, name: `Test Ürün ${seq}`, status: "ACTIVE", primaryCategoryId: category.id },
  });
  return db.productVariant.create({
    data: { productId: product.id, sku: `TEST-${seq}`, name: "1 kg Paket", packageType: "PAKET", priceKurus: 25_000, trackStock, stock },
  });
}

async function createOrder(variantId: string, quantity: number, options: { status?: string; reserve?: boolean } = {}) {
  seq++;
  const totalKurus = 25_000 * quantity;
  const order = await db.order.create({
    data: {
      orderNumber: `BMTEST${seq}`,
      status: options.status ?? "PENDING_PAYMENT",
      paymentMethod: "CARD",
      email: "test@example.com",
      phone: "+905321234567",
      customerName: "Test Müşteri",
      shipFullName: "Test Müşteri",
      shipPhone: "+905321234567",
      shipCity: "İstanbul",
      shipDistrict: "Kadıköy",
      shipAddressLine: "Test Mah. 1",
      billType: "INDIVIDUAL",
      billFullName: "Test Müşteri",
      billCity: "İstanbul",
      billDistrict: "Kadıköy",
      billAddressLine: "Test Mah. 1",
      subtotalKurus: totalKurus,
      vatKurus: Math.round((totalKurus * 1) / 101),
      totalKurus,
      idempotencyKey: `idem-${seq}`,
      agreementsAcceptedAt: new Date(),
      isTest: true,
      items: {
        create: {
          productId: (await db.productVariant.findUniqueOrThrow({ where: { id: variantId } })).productId,
          variantId,
          productName: "Test Ürün",
          variantName: "1 kg Paket",
          sku: "TEST",
          unitPriceKurus: 25_000,
          vatRate: 1,
          quantity,
          lineTotalKurus: totalKurus,
        },
      },
    },
  });
  if (options.reserve !== false) {
    await db.$transaction((tx) => reserveStock(tx, variantId, quantity, order.id));
  }
  const payment = await db.payment.create({
    data: { orderId: order.id, provider: "mock", mode: "TEST", status: "INITIATED", amountKurus: totalKurus, reference: `REF${seq}` },
  });
  return { order, payment };
}

const stockOf = async (variantId: string) => (await db.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock;

beforeEach(() => {
  seq += 100;
});

afterAll(async () => {
  await db.$disconnect();
});

describe("stok ayırma", () => {
  it("yetersiz stokta eksiye düşmez ve hata verir", async () => {
    const variant = await createVariant(3);
    const { order } = await createOrder(variant.id, 2);
    expect(await stockOf(variant.id)).toBe(1);
    await expect(db.$transaction((tx) => reserveStock(tx, variant.id, 2, order.id))).rejects.toBeInstanceOf(InsufficientStockError);
    expect(await stockOf(variant.id)).toBe(1);
  });

  it("stok takibi kapalı varyantta stok değişmez", async () => {
    const variant = await createVariant(0, false);
    await createOrder(variant.id, 5);
    expect(await stockOf(variant.id)).toBe(0);
  });

  it("serbest bırakma hareket kayıtlarına göre birebir geri verir ve tekrarlanınca iki kez vermez", async () => {
    const variant = await createVariant(10);
    const { order } = await createOrder(variant.id, 4);
    expect(await stockOf(variant.id)).toBe(6);
    await db.$transaction((tx) => releaseOrderStock(tx, order.id, "test"));
    expect(await stockOf(variant.id)).toBe(10);
    await db.$transaction((tx) => releaseOrderStock(tx, order.id, "test"));
    expect(await stockOf(variant.id)).toBe(10);
  });
});

describe("ödeme sonuçlandırma", () => {
  it("başarılı bildirim siparişi ödendi yapar", async () => {
    const variant = await createVariant(10);
    const { order, payment } = await createOrder(variant.id, 1);
    const result = await finalizePayment({ provider: "mock", reference: payment.reference, eventKey: `e-${payment.reference}`, status: "SUCCEEDED", paidAmountKurus: 25_000 });
    expect(result).toMatchObject({ result: "PROCESSED", becamePaid: true, orderNumber: order.orderNumber });
    const updated = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("PAID");
    expect(updated.paymentStatus).toBe("PAID");
    expect(updated.paidAt).not.toBeNull();
  });

  it("aynı bildirim tekrar gelirse ikinci kez işlenmez (idempotency)", async () => {
    const variant = await createVariant(10);
    const { order, payment } = await createOrder(variant.id, 1);
    const outcome = { provider: "mock", reference: payment.reference, eventKey: `e-${payment.reference}`, status: "SUCCEEDED" as const, paidAmountKurus: 25_000 };
    await finalizePayment(outcome);
    const again = await finalizePayment(outcome);
    expect(again.result).toBe("DUPLICATE");
    const otherKey = await finalizePayment({ ...outcome, eventKey: `baska-${payment.reference}` });
    expect(otherKey.result).toBe("DUPLICATE");
    const paidEvents = await db.orderStatusEvent.count({ where: { orderId: order.id, toStatus: "PAID" } });
    expect(paidEvents).toBe(1);
  });

  it("eksik tahsil edilen tutarda sipariş ödendi işaretlenmez", async () => {
    const variant = await createVariant(10);
    const { order, payment } = await createOrder(variant.id, 2);
    const result = await finalizePayment({ provider: "mock", reference: payment.reference, eventKey: `e-${payment.reference}`, status: "SUCCEEDED", paidAmountKurus: 100 });
    expect(result.result).toBe("AMOUNT_MISMATCH");
    const updated = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.paymentStatus).toBe("UNPAID");
    expect(updated.status).toBe("PENDING_PAYMENT");
  });

  it("başarısız ödeme siparişi değiştirmez, ödeme kaydını başarısız yapar", async () => {
    const variant = await createVariant(10);
    const { order, payment } = await createOrder(variant.id, 1);
    const result = await finalizePayment({ provider: "mock", reference: payment.reference, eventKey: `e-${payment.reference}`, status: "FAILED", failureMessage: "Kart reddedildi" });
    expect(result).toMatchObject({ result: "PROCESSED", becamePaid: false });
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING_PAYMENT");
    expect((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("FAILED");
  });

  it("farklı sağlayıcı adına gelen bildirim eşleşmez", async () => {
    const variant = await createVariant(10);
    const { payment } = await createOrder(variant.id, 1);
    const result = await finalizePayment({ provider: "paytr", reference: payment.reference, eventKey: `e-${payment.reference}`, status: "SUCCEEDED" });
    expect(result.result).toBe("NOT_FOUND");
  });

  it("süresi dolmuş siparişe geç gelen ödemede stok yeniden ayrılır", async () => {
    const variant = await createVariant(5);
    const { order, payment } = await createOrder(variant.id, 2);
    await db.$transaction(async (tx) => {
      await releaseOrderStock(tx, order.id, "süre doldu");
      await tx.order.update({ where: { id: order.id }, data: { status: "EXPIRED", stockReleasedAt: new Date() } });
    });
    expect(await stockOf(variant.id)).toBe(5);
    const result = await finalizePayment({ provider: "mock", reference: payment.reference, eventKey: `e-${payment.reference}`, status: "SUCCEEDED", paidAmountKurus: 50_000 });
    expect(result).toMatchObject({ result: "PROCESSED", becamePaid: true });
    expect(await stockOf(variant.id)).toBe(3);
    const updated = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("PAID");
    expect(updated.stockReleasedAt).toBeNull();
  });

  it("geç gelen ödemede stok yetersizse sipariş ödendi olur ama yöneticiye not düşülür", async () => {
    const variant = await createVariant(2);
    const { order, payment } = await createOrder(variant.id, 2);
    await db.$transaction(async (tx) => {
      await releaseOrderStock(tx, order.id, "süre doldu");
      await tx.order.update({ where: { id: order.id }, data: { status: "EXPIRED", stockReleasedAt: new Date() } });
    });
    await db.productVariant.update({ where: { id: variant.id }, data: { stock: 1 } });
    const result = await finalizePayment({ provider: "mock", reference: payment.reference, eventKey: `e-${payment.reference}`, status: "SUCCEEDED" });
    expect(result.becamePaid).toBe(true);
    const updated = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.stockReleasedAt).not.toBeNull();
    const note = await db.orderStatusEvent.findFirst({ where: { orderId: order.id, note: { contains: "stok yetersiz" } } });
    expect(note?.isCustomerVisible).toBe(false);
    expect(await stockOf(variant.id)).toBe(1);
  });

  it("aynı siparişin ikinci başarılı ödemesi mükerrer tahsilat olarak işaretlenir", async () => {
    const variant = await createVariant(10);
    const { order, payment } = await createOrder(variant.id, 1);
    const second = await db.payment.create({
      data: { orderId: order.id, provider: "mock", mode: "TEST", status: "INITIATED", amountKurus: 25_000, reference: `${payment.reference}-2` },
    });
    await finalizePayment({ provider: "mock", reference: payment.reference, eventKey: `e-${payment.reference}`, status: "SUCCEEDED" });
    const result = await finalizePayment({ provider: "mock", reference: second.reference, eventKey: `e-${second.reference}`, status: "SUCCEEDED" });
    expect(result).toMatchObject({ result: "PROCESSED", becamePaid: false });
    const warning = await db.orderStatusEvent.findFirst({ where: { orderId: order.id, note: { contains: "ikinci bir başarılı ödeme" } } });
    expect(warning).not.toBeNull();
  });
});
