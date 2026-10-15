import { describe, expect, it } from "vitest";
import { formatTRY } from "@/lib/money";
import { allocateDiscount, calculateTotals, evaluateCoupon, portionPlan, resolveUnitPrice, type CouponRule } from "@/lib/pricing";

const shipping = { feeKurus: 9_990, freeThresholdKurus: 150_000, vatRate: 20 };
const line = (unitPriceKurus: number, quantity: number, vatRate = 1, freeShipping = false) => ({ unitPriceKurus, quantity, vatRate, freeShipping });

describe("allocateDiscount", () => {
  it("dağıtılan toplam indirime birebir eşittir", () => {
    const lines = [33_333, 33_333, 33_334];
    const result = allocateDiscount(lines, 10_001);
    expect(result.reduce((a, b) => a + b, 0)).toBe(10_001);
  });

  it("hiçbir satır kendi tutarını aşmaz ve indirim ara toplamla sınırlıdır", () => {
    const lines = [100, 50];
    const result = allocateDiscount(lines, 1_000);
    expect(result).toEqual([100, 50]);
  });

  it("tutara orantılı dağıtır", () => {
    expect(allocateDiscount([30_000, 10_000], 4_000)).toEqual([3_000, 1_000]);
  });

  it("negatif veya sıfır indirimde boş dağıtım döner", () => {
    expect(allocateDiscount([1_000, 2_000], -5)).toEqual([0, 0]);
    expect(allocateDiscount([], 500)).toEqual([]);
  });
});

describe("calculateTotals", () => {
  it("boş sepet", () => {
    const totals = calculateTotals([], shipping, null);
    expect(totals.shippingStatus).toBe("EMPTY");
    expect(totals.totalKurus).toBe(0);
  });

  it("eşik altında kargo ücreti eklenir ve ücretsiz kargoya kalan tutar hesaplanır", () => {
    const totals = calculateTotals([line(25_000, 2)], shipping, null);
    expect(totals.subtotalKurus).toBe(50_000);
    expect(totals.shippingKurus).toBe(9_990);
    expect(totals.shippingStatus).toBe("CHARGED");
    expect(totals.amountToFreeShippingKurus).toBe(100_000);
    expect(totals.totalKurus).toBe(59_990);
  });

  it("eşik indirim sonrası tutara göre değerlendirilir", () => {
    const atThreshold = calculateTotals([line(150_000, 1)], shipping, null);
    expect(atThreshold.shippingStatus).toBe("FREE_THRESHOLD");
    const discounted = calculateTotals([line(150_000, 1)], shipping, { discountKurus: 1, freeShipping: false });
    expect(discounted.shippingStatus).toBe("CHARGED");
  });

  it("tüm ürünler ücretsiz kargolu ise kargo alınmaz (kargo ücreti tanımsız olsa bile)", () => {
    const totals = calculateTotals([line(94_900, 1, 20, true)], { ...shipping, feeKurus: null }, null);
    expect(totals.shippingStatus).toBe("FREE_ITEMS");
    expect(totals.shippingKurus).toBe(0);
  });

  it("kargo ücreti tanımlı değilse durum NOT_CONFIGURED olur (sipariş alınmaz)", () => {
    const totals = calculateTotals([line(22_000, 1)], { ...shipping, feeKurus: null }, null);
    expect(totals.shippingStatus).toBe("NOT_CONFIGURED");
  });

  it("ücretsiz kargo kuponu kargoyu sıfırlar", () => {
    const totals = calculateTotals([line(22_000, 1)], shipping, { discountKurus: 0, freeShipping: true });
    expect(totals.shippingStatus).toBe("FREE_COUPON");
    expect(totals.totalKurus).toBe(22_000);
  });

  it("KDV satır bazında indirim düşüldükten sonra hesaplanır ve kargo KDV'si eklenir", () => {
    // %1 KDV'li 10.100 TL + %20 KDV'li 12.000 TL, 2.210 TL indirim
    const totals = calculateTotals([line(1_010_000, 1, 1), line(1_200_000, 1, 20)], { feeKurus: 12_000, freeThresholdKurus: null, vatRate: 20 }, { discountKurus: 221_000, freeShipping: false });
    expect(totals.lineDiscounts).toEqual([101_000, 120_000]);
    // (1.010.000 − 101.000) içindeki %1 KDV = 9.000; (1.200.000 − 120.000) içindeki %20 KDV = 180.000; kargo KDV'si 2.000
    expect(totals.vatKurus).toBe(9_000 + 180_000 + 2_000);
    expect(totals.totalKurus).toBe(2_210_000 - 221_000 + 12_000);
  });

  it("indirim ara toplamı aşamaz", () => {
    const totals = calculateTotals([line(5_000, 1)], shipping, { discountKurus: 99_999, freeShipping: false });
    expect(totals.discountKurus).toBe(5_000);
    expect(totals.totalKurus).toBe(9_990);
  });
});

describe("resolveUnitPrice (B2B fiyat listesi)", () => {
  it("liste yoksa liste fiyatı", () => {
    expect(resolveUnitPrice(100_000, 5, [])).toBe(100_000);
  });
  it("adet koşulunu sağlayan en düşük fiyat uygulanır", () => {
    const tiers = [
      { priceKurus: 95_000, minQty: 1 },
      { priceKurus: 90_000, minQty: 10 },
    ];
    expect(resolveUnitPrice(100_000, 5, tiers)).toBe(95_000);
    expect(resolveUnitPrice(100_000, 10, tiers)).toBe(90_000);
  });
  it("liste fiyatından yüksek özel fiyat uygulanmaz", () => {
    expect(resolveUnitPrice(100_000, 1, [{ priceKurus: 120_000, minQty: 1 }])).toBe(100_000);
  });
});

describe("evaluateCoupon", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  const base: CouponRule = {
    type: "PERCENT",
    value: 10,
    minSubtotalKurus: null,
    maxDiscountKurus: null,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    usageLimitPerEmail: null,
    usedCount: 0,
    isActive: true,
  };
  const check = (rule: Partial<CouponRule> | null, subtotalKurus = 100_000, emailUsageCount?: number) =>
    evaluateCoupon(rule === null ? null : { ...base, ...rule }, { subtotalKurus, now, emailUsageCount }, formatTRY);

  it("yüzde indirim ve üst sınır", () => {
    expect(check({})).toEqual({ ok: true, effect: { discountKurus: 10_000, freeShipping: false } });
    expect(check({ maxDiscountKurus: 5_000 })).toEqual({ ok: true, effect: { discountKurus: 5_000, freeShipping: false } });
  });

  it("sabit indirim ara toplamı aşamaz", () => {
    expect(check({ type: "FIXED", value: 500_000 })).toEqual({ ok: true, effect: { discountKurus: 100_000, freeShipping: false } });
  });

  it("geçersiz durumlar reddedilir", () => {
    expect(check(null).ok).toBe(false);
    expect(check({ isActive: false }).ok).toBe(false);
    expect(check({ startsAt: new Date("2026-10-16T00:00:00Z") }).ok).toBe(false);
    expect(check({ endsAt: new Date("2026-10-14T00:00:00Z") }).ok).toBe(false);
    expect(check({ usageLimit: 5, usedCount: 5 }).ok).toBe(false);
    expect(check({ usageLimitPerEmail: 1 }, 100_000, 1).ok).toBe(false);
    expect(check({ type: "BILINMEYEN" }).ok).toBe(false);
  });

  it("en düşük sepet tutarı mesajı tutarı içerir", () => {
    const result = check({ minSubtotalKurus: 200_000 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("2.000,00");
  });

  it("ücretsiz kargo kuponu indirim üretmez", () => {
    expect(check({ type: "FREE_SHIPPING" })).toEqual({ ok: true, effect: { discountKurus: 0, freeShipping: true } });
  });
});

describe("portionPlan", () => {
  it("gereken paket adedi, artan miktar ve porsiyon maliyeti", () => {
    const plan = portionPlan({ portions: 250, gramsPerPortion: 40, packageNetGrams: 10_000, packagePriceKurus: 220_000 });
    expect(plan.totalGrams).toBe(10_000);
    expect(plan.packages).toBe(1);
    expect(plan.leftoverGrams).toBe(0);
    expect(plan.portionsPerPackage).toBe(250);
    expect(plan.costPerPortionKurus).toBe(880);
    const more = portionPlan({ portions: 251, gramsPerPortion: 40, packageNetGrams: 10_000, packagePriceKurus: 220_000 });
    expect(more.packages).toBe(2);
    expect(more.leftoverGrams).toBe(9_960);
  });
});
