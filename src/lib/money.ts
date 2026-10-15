// Para birimi yardımcıları. Tüm tutarlar kuruş (1 TL = 100 kuruş) cinsinden tamsayıdır.

const tryFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });

export function formatTRY(kurus: number): string {
  return tryFormatter.format(kurus / 100);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** "1.234,56" / "1234.56" / "1234,5" gibi girdileri kuruşa çevirir. Geçersizse null döner. */
export function parseTRYToKurus(input: string): number | null {
  const cleaned = input.replace(/[₺\s]|TL/gi, "").trim();
  if (!cleaned) return null;
  let normalized = cleaned;
  if (cleaned.includes(",")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Kuruşu form alanında gösterilecek "1234,50" biçimine çevirir */
export function kurusToInput(kurus: number | null | undefined): string {
  if (kurus === null || kurus === undefined) return "";
  const whole = Math.floor(kurus / 100);
  const fraction = kurus % 100;
  return fraction === 0 ? String(whole) : `${whole},${String(fraction).padStart(2, "0")}`;
}

/** Ödeme sağlayıcıları için "1234.50" biçimi */
export function kurusToDecimalString(kurus: number): string {
  const whole = Math.floor(kurus / 100);
  const fraction = kurus % 100;
  return `${whole}.${String(fraction).padStart(2, "0")}`;
}

/** KDV dahil tutarın içindeki KDV payı (kuruş, en yakın tamsayıya yuvarlanır) */
export function includedVat(grossKurus: number, ratePercent: number): number {
  if (ratePercent <= 0 || grossKurus <= 0) return 0;
  return Math.round((grossKurus * ratePercent) / (100 + ratePercent));
}

/** Birim fiyat (TL/kg) — Fiyat Etiketi Yönetmeliği gereği ağırlıkla satılan ürünlerde gösterilir */
export function unitPricePerKg(priceKurus: number, netWeightGrams: number | null | undefined): number | null {
  if (!netWeightGrams || netWeightGrams <= 0) return null;
  return Math.round((priceKurus * 1000) / netWeightGrams);
}

export function formatWeight(grams: number | null | undefined): string | null {
  if (!grams || grams <= 0) return null;
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${formatNumber(kg)} kg`;
  }
  return `${grams} g`;
}
