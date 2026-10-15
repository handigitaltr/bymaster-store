"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import {
  addOrderItemsToCart,
  addToCart,
  fixCartProblems,
  getCurrentPricedCart,
  removeCartItem,
  setCartCoupon,
  updateCartItemQuantity,
} from "@/lib/cart";
import { getPairings, type ProductCardData } from "@/lib/catalog";
import { db } from "@/lib/db";
import { expireStaleOrders } from "@/lib/orders";
import { rateLimit, rateLimitMessage } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

const variantSchema = z.object({
  variantId: z.string().min(10).max(40),
  quantity: z.coerce.number().int().min(1).max(999),
});

export type AddToCartResult =
  | {
      ok: true;
      count: number;
      added: {
        productName: string;
        variantName: string;
        imageUrl: string | null;
        imageAlt: string;
        quantity: number;
        unitPriceKurus: number;
        slug: string;
      } | null;
      subtotalKurus: number;
      amountToFreeShippingKurus: number | null;
      suggestions: ProductCardData[];
      suggestionSource: "ORDERS" | "CURATED" | "RULES";
    }
  | { ok: false; message: string };

async function guard(): Promise<string | null> {
  const ip = await getClientIp();
  const limit = await rateLimit("cart", ip);
  return limit.ok ? null : rateLimitMessage(limit.retryAfterSeconds);
}

export async function addToCartAction(input: { variantId: string; quantity: number }): Promise<AddToCartResult> {
  const parsed = variantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Geçersiz istek." };
  const blocked = await guard();
  if (blocked) return { ok: false, message: blocked };

  // Ödeme süresi dolmuş siparişlerin tuttuğu stok, yeni ekleme denenmeden önce serbest bırakılır (20 sn aralıkla)
  await expireStaleOrders();
  const result = await addToCart(parsed.data.variantId, parsed.data.quantity);
  if (!result.ok) return result;

  const priced = await getCurrentPricedCart();
  const line = priced.lines.find((l) => l.variantId === parsed.data.variantId) ?? null;
  let suggestions: ProductCardData[] = [];
  let suggestionSource: "ORDERS" | "CURATED" | "RULES" = "RULES";
  if (line) {
    const pairings = await getPairings(line.productId, 6);
    const inCart = new Set(priced.lines.map((l) => l.productId));
    suggestions = pairings.products.filter((p) => !inCart.has(p.id) && p.variant && (p.availability === "IN_STOCK" || p.availability === "LOW_STOCK")).slice(0, 3);
    suggestionSource = pairings.source;
  }
  revalidatePath("/sepet");
  return {
    ok: true,
    count: priced.itemCount,
    added: line
      ? {
          productName: line.productName,
          variantName: line.variantName,
          imageUrl: line.imageUrl,
          imageAlt: line.imageAlt,
          quantity: parsed.data.quantity,
          unitPriceKurus: line.unitPriceKurus,
          slug: line.slug,
        }
      : null,
    subtotalKurus: priced.totals.subtotalKurus,
    amountToFreeShippingKurus: priced.totals.amountToFreeShippingKurus,
    suggestions,
    suggestionSource,
  };
}

/** Tarif sayfasındaki "Tümünü sepete ekle" gibi toplu eklemeler */
export async function addManyToCartAction(variantIds: string[]): Promise<{ ok: boolean; added: number; messages: string[]; count: number }> {
  const ids = z.array(z.string().min(10).max(40)).max(20).safeParse(variantIds);
  if (!ids.success) return { ok: false, added: 0, messages: ["Geçersiz istek."], count: 0 };
  const blocked = await guard();
  if (blocked) return { ok: false, added: 0, messages: [blocked], count: 0 };
  const messages: string[] = [];
  let added = 0;
  for (const variantId of ids.data) {
    const result = await addToCart(variantId, 1);
    if (result.ok) added++;
    else {
      const variant = await db.productVariant.findUnique({ where: { id: variantId }, select: { product: { select: { name: true } } } });
      messages.push(`${variant?.product.name ?? "Ürün"}: ${result.message}`);
    }
  }
  const priced = await getCurrentPricedCart();
  revalidatePath("/sepet");
  return { ok: added > 0, added, messages, count: priced.itemCount };
}

export type CartFormState = { message?: string; tone?: "error" | "success" } | null;

export async function updateQuantityAction(_prev: CartFormState, formData: FormData): Promise<CartFormState> {
  const parsed = z
    .object({ variantId: z.string().min(10).max(40), quantity: z.coerce.number().int().min(0).max(999) })
    .safeParse({ variantId: formData.get("variantId"), quantity: formData.get("quantity") });
  if (!parsed.success) return { message: "Geçersiz adet.", tone: "error" };
  const blocked = await guard();
  if (blocked) return { message: blocked, tone: "error" };
  const result = await updateCartItemQuantity(parsed.data.variantId, parsed.data.quantity);
  revalidatePath("/sepet");
  revalidatePath("/odeme");
  return result.ok ? null : { message: result.message, tone: "error" };
}

export async function setQuantityAction(variantId: string, quantity: number): Promise<{ ok: boolean; message?: string }> {
  const parsed = z
    .object({ variantId: z.string().min(10).max(40), quantity: z.number().int().min(0).max(999) })
    .safeParse({ variantId, quantity });
  if (!parsed.success) return { ok: false, message: "Geçersiz adet." };
  const blocked = await guard();
  if (blocked) return { ok: false, message: blocked };
  const result = await updateCartItemQuantity(parsed.data.variantId, parsed.data.quantity);
  revalidatePath("/sepet");
  return result.ok ? { ok: true } : { ok: false, message: result.message };
}

export async function removeItemAction(formData: FormData): Promise<void> {
  const variantId = z.string().min(10).max(40).safeParse(formData.get("variantId"));
  if (!variantId.success) return;
  await removeCartItem(variantId.data);
  revalidatePath("/sepet");
  revalidatePath("/odeme");
}

export async function fixCartAction(): Promise<void> {
  await fixCartProblems();
  revalidatePath("/sepet");
  revalidatePath("/odeme");
}

export async function applyCouponAction(_prev: CartFormState, formData: FormData): Promise<CartFormState> {
  const code = z
    .string()
    .trim()
    .min(2, "Kodu girin.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Kod yalnızca harf, rakam ve tire içerebilir.")
    .safeParse(formData.get("code"));
  if (!code.success) return { message: code.error.issues[0]?.message ?? "Geçersiz kod.", tone: "error" };
  const ip = await getClientIp();
  const limit = await rateLimit("coupon", ip);
  if (!limit.ok) return { message: rateLimitMessage(limit.retryAfterSeconds), tone: "error" };

  const normalized = code.data.toLocaleUpperCase("tr-TR");
  const coupon = await db.coupon.findUnique({ where: { code: normalized }, select: { id: true } });
  if (!coupon) return { message: "Bu kod geçerli değil.", tone: "error" };
  await setCartCoupon(normalized);
  const priced = await getCurrentPricedCart();
  if (!priced.couponApplied) {
    await setCartCoupon(null);
    revalidatePath("/sepet");
    return { message: priced.couponMessage ?? "Bu kod sepetinize uygulanamadı.", tone: "error" };
  }
  revalidatePath("/sepet");
  revalidatePath("/odeme");
  return { message: "İndirim kodu uygulandı.", tone: "success" };
}

export async function removeCouponAction(): Promise<void> {
  await setCartCoupon(null);
  revalidatePath("/sepet");
  revalidatePath("/odeme");
}

/** Hesabım > Sipariş detay: "Tekrar sipariş ver" */
export async function reorderAction(orderId: string): Promise<{ ok: boolean; added: number; skipped: string[] }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, added: 0, skipped: ["Bu işlem için giriş yapmalısınız."] };
  const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, include: { items: true } });
  if (!order) return { ok: false, added: 0, skipped: ["Sipariş bulunamadı."] };
  const blocked = await guard();
  if (blocked) return { ok: false, added: 0, skipped: [blocked] };
  const result = await addOrderItemsToCart(order.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })));
  revalidatePath("/sepet");
  return { ok: result.added > 0, ...result };
}
