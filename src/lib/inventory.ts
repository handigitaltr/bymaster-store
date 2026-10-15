import "server-only";
import type { TxClient } from "@/lib/db";

export class InsufficientStockError extends Error {
  constructor(public variantId: string) {
    super("Yetersiz stok");
    this.name = "InsufficientStockError";
  }
}

type MovementInput = {
  variantId: string;
  change: number;
  reason: "ADJUSTMENT" | "RESTOCK" | "ORDER_RESERVED" | "ORDER_RELEASED" | "RETURN" | "CORRECTION";
  orderId?: string | null;
  note?: string | null;
  actorId?: string | null;
};

/** Stok değişikliğini uygular ve hareket kaydı oluşturur (her zaman bir transaction içinde çağrılır) */
export async function recordStockChange(tx: TxClient, input: MovementInput): Promise<number> {
  const variant = await tx.productVariant.update({
    where: { id: input.variantId },
    data: { stock: { increment: input.change } },
    select: { stock: true },
  });
  await tx.inventoryMovement.create({
    data: {
      variantId: input.variantId,
      change: input.change,
      stockAfter: variant.stock,
      reason: input.reason,
      orderId: input.orderId ?? null,
      note: input.note ?? null,
      actorId: input.actorId ?? null,
    },
  });
  return variant.stock;
}

/**
 * Koşullu stok düşümü: yalnızca yeterli stok varsa düşer (eşzamanlı siparişlerde eksiye düşmeyi önler).
 * Stok takibi kapalı varyantlarda hiçbir şey yapmaz.
 */
export async function reserveStock(tx: TxClient, variantId: string, quantity: number, orderId: string) {
  const variant = await tx.productVariant.findUnique({ where: { id: variantId }, select: { trackStock: true } });
  if (!variant) throw new InsufficientStockError(variantId);
  if (!variant.trackStock) return;
  const updated = await tx.productVariant.updateMany({
    where: { id: variantId, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });
  if (updated.count === 0) throw new InsufficientStockError(variantId);
  const after = await tx.productVariant.findUniqueOrThrow({ where: { id: variantId }, select: { stock: true } });
  await tx.inventoryMovement.create({
    data: { variantId, change: -quantity, stockAfter: after.stock, reason: "ORDER_RESERVED", orderId },
  });
}

/** Bir siparişin rezerve ettiği stoğu hareket kayıtlarına göre birebir geri verir */
export async function releaseOrderStock(tx: TxClient, orderId: string, note: string, actorId?: string | null) {
  const movements = await tx.inventoryMovement.findMany({ where: { orderId } });
  const net = new Map<string, number>();
  for (const movement of movements) {
    if (movement.reason === "ORDER_RESERVED" || movement.reason === "ORDER_RELEASED") {
      net.set(movement.variantId, (net.get(movement.variantId) ?? 0) + movement.change);
    }
  }
  for (const [variantId, change] of net) {
    if (change < 0) {
      await recordStockChange(tx, { variantId, change: -change, reason: "ORDER_RELEASED", orderId, note, actorId });
    }
  }
}
