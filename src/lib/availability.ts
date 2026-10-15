// Saf stok/uygunluk hesapları (istemci ve sunucuda ortak kullanılır)

export type Availability = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "COMING_SOON";

export type StockInfo = {
  trackStock: boolean;
  stock: number;
  lowStockThreshold: number;
};

export function variantAvailability(variant: StockInfo, saleStatus: string): Availability {
  if (saleStatus === "COMING_SOON") return "COMING_SOON";
  if (!variant.trackStock) return "IN_STOCK";
  if (variant.stock <= 0) return "OUT_OF_STOCK";
  if (variant.stock <= variant.lowStockThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  IN_STOCK: "Stokta",
  LOW_STOCK: "Sınırlı stok",
  OUT_OF_STOCK: "Tükendi",
  COMING_SOON: "Yakında",
};

export function isPurchasable(availability: Availability): boolean {
  return availability === "IN_STOCK" || availability === "LOW_STOCK";
}

/** Sepete eklenebilecek en yüksek adet */
export function maxPurchasableQty(variant: StockInfo & { maxOrderQty: number | null }): number {
  const hardCap = 999;
  const byStock = variant.trackStock ? Math.max(0, variant.stock) : hardCap;
  return Math.min(byStock, variant.maxOrderQty ?? hardCap, hardCap);
}
