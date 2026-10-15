// Saf fiyatlandırma fonksiyonları — veritabanına erişmez, birim testlerle doğrulanır.
// Tüm fiyatlar KDV dahildir ve kuruş cinsindendir.
import { includedVat } from "./money";

export type PricingLine = {
  unitPriceKurus: number;
  quantity: number;
  vatRate: number;
  freeShipping: boolean;
};

export type ShippingConfig = {
  feeKurus: number | null; // null: kargo ücreti yapılandırılmamış
  freeThresholdKurus: number | null;
  vatRate: number;
};

export type CouponEffect = { discountKurus: number; freeShipping: boolean };

export type ShippingStatus =
  | "EMPTY"
  | "CHARGED"
  | "FREE_ITEMS"
  | "FREE_THRESHOLD"
  | "FREE_COUPON"
  | "FREE_ALWAYS"
  | "NOT_CONFIGURED";

export type Totals = {
  subtotalKurus: number;
  discountKurus: number;
  lineTotals: number[];
  lineDiscounts: number[];
  shippingKurus: number;
  shippingStatus: ShippingStatus;
  amountToFreeShippingKurus: number | null;
  vatKurus: number;
  totalKurus: number;
};

/**
 * İndirimi satırlara tutar oranında dağıtır (en büyük kalan yöntemi).
 * Dağıtılan toplam her zaman indirime birebir eşittir; hiçbir satır kendi tutarını aşmaz.
 */
export function allocateDiscount(lineTotals: number[], discountKurus: number): number[] {
  const total = lineTotals.reduce((sum, value) => sum + value, 0);
  const discount = Math.min(Math.max(0, Math.floor(discountKurus)), total);
  if (discount === 0 || total === 0) return lineTotals.map(() => 0);

  const raw = lineTotals.map((value) => (value * discount) / total);
  const floors = raw.map(Math.floor);
  let remainder = discount - floors.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || lineTotals[b.index] - lineTotals[a.index]);

  for (const { index } of order) {
    if (remainder <= 0) break;
    if (floors[index] < lineTotals[index]) {
      floors[index] += 1;
      remainder -= 1;
    }
  }
  return floors;
}

export function calculateTotals(
  lines: PricingLine[],
  shipping: ShippingConfig,
  coupon: CouponEffect | null,
): Totals {
  const lineTotals = lines.map((line) => line.unitPriceKurus * line.quantity);
  const subtotalKurus = lineTotals.reduce((sum, value) => sum + value, 0);

  if (lines.length === 0) {
    return {
      subtotalKurus: 0,
      discountKurus: 0,
      lineTotals: [],
      lineDiscounts: [],
      shippingKurus: 0,
      shippingStatus: "EMPTY",
      amountToFreeShippingKurus: null,
      vatKurus: 0,
      totalKurus: 0,
    };
  }

  const discountKurus = Math.min(coupon?.discountKurus ?? 0, subtotalKurus);
  const lineDiscounts = allocateDiscount(lineTotals, discountKurus);
  const afterDiscount = subtotalKurus - discountKurus;

  let shippingKurus = 0;
  let shippingStatus: ShippingStatus;
  let amountToFreeShippingKurus: number | null = null;

  if (lines.every((line) => line.freeShipping)) {
    shippingStatus = "FREE_ITEMS";
  } else if (coupon?.freeShipping) {
    shippingStatus = "FREE_COUPON";
  } else if (shipping.feeKurus === null) {
    shippingStatus = "NOT_CONFIGURED";
  } else if (shipping.freeThresholdKurus !== null && afterDiscount >= shipping.freeThresholdKurus) {
    shippingStatus = "FREE_THRESHOLD";
  } else {
    shippingKurus = shipping.feeKurus;
    shippingStatus = shippingKurus === 0 ? "FREE_ALWAYS" : "CHARGED";
    if (shipping.freeThresholdKurus !== null && shippingKurus > 0) {
      amountToFreeShippingKurus = shipping.freeThresholdKurus - afterDiscount;
    }
  }

  const itemsVat = lines.reduce(
    (sum, line, index) => sum + includedVat(lineTotals[index] - lineDiscounts[index], line.vatRate),
    0,
  );
  const vatKurus = itemsVat + includedVat(shippingKurus, shipping.vatRate);

  return {
    subtotalKurus,
    discountKurus,
    lineTotals,
    lineDiscounts,
    shippingKurus,
    shippingStatus,
    amountToFreeShippingKurus,
    vatKurus,
    totalKurus: afterDiscount + shippingKurus,
  };
}

export type PriceTier = { priceKurus: number; minQty: number };

/**
 * B2B fiyat listesi çözümlemesi: miktara uyan en düşük kademeli fiyat, liste fiyatından düşükse uygulanır.
 * Fiyat listesi tanımlı değilse liste fiyatı döner.
 */
export function resolveUnitPrice(listPriceKurus: number, quantity: number, tiers: PriceTier[]): number {
  const eligible = tiers.filter((tier) => tier.minQty <= quantity && tier.priceKurus > 0);
  if (eligible.length === 0) return listPriceKurus;
  return Math.min(listPriceKurus, ...eligible.map((tier) => tier.priceKurus));
}

export type CouponRule = {
  type: string;
  value: number;
  minSubtotalKurus: number | null;
  maxDiscountKurus: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageLimitPerEmail: number | null;
  usedCount: number;
  isActive: boolean;
};

export type CouponCheck = { ok: true; effect: CouponEffect } | { ok: false; message: string };

export function evaluateCoupon(
  coupon: CouponRule | null,
  context: { subtotalKurus: number; now: Date; emailUsageCount?: number },
  formatMoney: (kurus: number) => string,
): CouponCheck {
  if (!coupon || !coupon.isActive) return { ok: false, message: "Bu kod geçerli değil." };
  if (coupon.startsAt && coupon.startsAt > context.now) return { ok: false, message: "Bu kampanya henüz başlamadı." };
  if (coupon.endsAt && coupon.endsAt < context.now) return { ok: false, message: "Bu kampanyanın süresi doldu." };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, message: "Bu kodun kullanım limiti doldu." };
  }
  if (
    coupon.usageLimitPerEmail !== null &&
    context.emailUsageCount !== undefined &&
    context.emailUsageCount >= coupon.usageLimitPerEmail
  ) {
    return { ok: false, message: "Bu kodu kullanım hakkınız doldu." };
  }
  if (coupon.minSubtotalKurus !== null && context.subtotalKurus < coupon.minSubtotalKurus) {
    return {
      ok: false,
      message: `Bu kod ${formatMoney(coupon.minSubtotalKurus)} ve üzeri alışverişlerde geçerlidir.`,
    };
  }

  if (coupon.type === "FREE_SHIPPING") return { ok: true, effect: { discountKurus: 0, freeShipping: true } };

  let discount = 0;
  if (coupon.type === "PERCENT") {
    const percent = Math.min(100, Math.max(0, coupon.value));
    discount = Math.floor((context.subtotalKurus * percent) / 100);
  } else if (coupon.type === "FIXED") {
    discount = Math.max(0, coupon.value);
  } else {
    return { ok: false, message: "Bu kod geçerli değil." };
  }
  if (coupon.maxDiscountKurus !== null) discount = Math.min(discount, coupon.maxDiscountKurus);
  discount = Math.min(discount, context.subtotalKurus);
  return { ok: true, effect: { discountKurus: discount, freeShipping: false } };
}

/** Porsiyon hesaplayıcı: ihtiyaç duyulan paket adedi ve maliyet */
export function portionPlan(input: {
  portions: number;
  gramsPerPortion: number;
  packageNetGrams: number;
  packagePriceKurus: number;
}) {
  const totalGrams = Math.max(0, input.portions) * Math.max(0, input.gramsPerPortion);
  const packages = input.packageNetGrams > 0 ? Math.ceil(totalGrams / input.packageNetGrams) : 0;
  const costPerPortionKurus =
    input.packageNetGrams > 0 ? (input.packagePriceKurus * input.gramsPerPortion) / input.packageNetGrams : 0;
  const portionsPerPackage = input.gramsPerPortion > 0 ? Math.floor(input.packageNetGrams / input.gramsPerPortion) : 0;
  return {
    totalGrams,
    packages,
    totalCostKurus: packages * input.packagePriceKurus,
    costPerPortionKurus,
    portionsPerPackage,
    leftoverGrams: packages * input.packageNetGrams - totalGrams,
  };
}
