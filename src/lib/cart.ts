import "server-only";
import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/guards";
import { secureCookies } from "@/lib/auth/session";
import { isPurchasable, maxPurchasableQty, variantAvailability, type Availability } from "@/lib/availability";
import { formatTRY } from "@/lib/money";
import { calculateTotals, evaluateCoupon, resolveUnitPrice, type Totals } from "@/lib/pricing";
import { randomToken, sha256Hex } from "@/lib/security/crypto";
import { getSettings, shippingConfig } from "@/lib/settings";

const CART_COOKIE = "bm_cart";
const CART_TTL_SECONDS = 60 * 60 * 24 * 60;

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              status: true,
              saleStatus: true,
              freeShipping: true,
              kind: true,
              primaryCategory: { select: { slug: true, name: true } },
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true, isPlaceholder: true, fit: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

export type CartRecord = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

async function readGuestToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  return token && token.length >= 20 && token.length <= 80 ? token : null;
}

/** Mevcut ziyaretçinin sepetini okur (oluşturmaz) */
export async function findCurrentCart(user?: CurrentUser | null): Promise<CartRecord | null> {
  const currentUser = user === undefined ? await getCurrentUser() : user;
  if (currentUser) return db.cart.findUnique({ where: { userId: currentUser.id }, include: cartInclude });
  const token = await readGuestToken();
  if (!token) return null;
  return db.cart.findUnique({ where: { tokenHash: sha256Hex(token) }, include: cartInclude });
}

/** Yalnızca Server Action / route handler içinde: sepeti bulur ya da oluşturur */
async function getOrCreateCartId(): Promise<string> {
  const user = await getCurrentUser();
  if (user) {
    const cart = await db.cart.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {}, select: { id: true } });
    return cart.id;
  }
  const store = await cookies();
  const existingToken = await readGuestToken();
  if (existingToken) {
    const existing = await db.cart.findUnique({ where: { tokenHash: sha256Hex(existingToken) }, select: { id: true } });
    if (existing) return existing.id;
  }
  const token = randomToken(24);
  const cart = await db.cart.create({ data: { tokenHash: sha256Hex(token) }, select: { id: true } });
  store.set(CART_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: secureCookies, path: "/", maxAge: CART_TTL_SECONDS });
  return cart.id;
}

export type CartLine = {
  itemId: string;
  variantId: string;
  productId: string;
  sku: string;
  slug: string;
  productName: string;
  variantName: string;
  packageType: string;
  netWeightGrams: number | null;
  categorySlug: string;
  categoryName: string;
  imageUrl: string | null;
  imageAlt: string;
  imageIsPlaceholder: boolean;
  imageFit: string;
  quantity: number;
  unitPriceKurus: number;
  listPriceKurus: number;
  vatRate: number;
  freeShipping: boolean;
  lineTotalKurus: number;
  availability: Availability;
  minQty: number;
  maxQty: number;
  problem: string | null;
  problemCode: "UNAVAILABLE" | "OVER_MAX" | "UNDER_MIN" | null;
};

export type PricedCart = {
  cartId: string | null;
  lines: CartLine[];
  totals: Totals;
  couponCode: string | null;
  couponApplied: boolean;
  couponMessage: string | null;
  couponId: string | null;
  problems: string[];
  itemCount: number;
};

/**
 * Sepeti veritabanındaki güncel fiyat, stok ve kampanya bilgileriyle yeniden fiyatlandırır.
 * Sorunlu satırlar (stok yok, satış dışı vb.) toplama dahil edilmez ve ödeme engellenir.
 */
export async function priceCart(cart: CartRecord | null, options: { user: CurrentUser | null; email?: string | null }): Promise<PricedCart> {
  const settings = await getSettings();
  const items = cart?.items ?? [];

  let tiersByVariant = new Map<string, Array<{ priceKurus: number; minQty: number }>>();
  if (options.user?.priceListId && items.length > 0) {
    const entries = await db.priceListEntry.findMany({
      where: {
        priceListId: options.user.priceListId,
        priceList: { isActive: true },
        variantId: { in: items.map((item) => item.variantId) },
      },
      select: { variantId: true, priceKurus: true, minQty: true },
    });
    tiersByVariant = entries.reduce((map, entry) => {
      map.set(entry.variantId, [...(map.get(entry.variantId) ?? []), entry]);
      return map;
    }, new Map<string, Array<{ priceKurus: number; minQty: number }>>());
  }

  const lines: CartLine[] = items.map((item) => {
    const { variant } = item;
    const { product } = variant;
    const availability = variantAvailability(variant, product.saleStatus);
    const maxQty = maxPurchasableQty(variant);
    let problem: string | null = null;
    let problemCode: CartLine["problemCode"] = null;
    if (product.status !== "ACTIVE" || !variant.isActive) {
      problem = "Bu ürün artık satışta değil.";
      problemCode = "UNAVAILABLE";
    } else if (availability === "COMING_SOON") {
      problem = "Bu ürün henüz satışa açılmadı.";
      problemCode = "UNAVAILABLE";
    } else if (variant.priceKurus <= 0) {
      problem = "Bu ürün şu anda satın alınamıyor.";
      problemCode = "UNAVAILABLE";
    } else if (!isPurchasable(availability)) {
      problem = "Bu ürün stokta kalmadı.";
      problemCode = "UNAVAILABLE";
    } else if (item.quantity > maxQty) {
      problem = `Stok nedeniyle bu üründen en fazla ${maxQty} adet sipariş edilebilir.`;
      problemCode = "OVER_MAX";
    } else if (item.quantity < variant.minOrderQty) {
      problem = `Bu ürün en az ${variant.minOrderQty} adet sipariş edilebilir.`;
      problemCode = "UNDER_MIN";
    }

    const unitPriceKurus = resolveUnitPrice(variant.priceKurus, item.quantity, tiersByVariant.get(variant.id) ?? []);
    const image = product.images[0];
    return {
      itemId: item.id,
      variantId: variant.id,
      productId: product.id,
      sku: variant.sku,
      slug: product.slug,
      productName: product.name,
      variantName: variant.name,
      packageType: variant.packageType,
      netWeightGrams: variant.netWeightGrams,
      categorySlug: product.primaryCategory.slug,
      categoryName: product.primaryCategory.name,
      imageUrl: image?.url ?? null,
      imageAlt: image?.alt ?? product.name,
      imageIsPlaceholder: image?.isPlaceholder ?? false,
      imageFit: image?.fit ?? "contain",
      quantity: item.quantity,
      unitPriceKurus,
      listPriceKurus: variant.priceKurus,
      vatRate: variant.vatRate,
      freeShipping: product.freeShipping,
      lineTotalKurus: unitPriceKurus * item.quantity,
      availability,
      minQty: variant.minOrderQty,
      maxQty,
      problem,
      problemCode,
    };
  });

  const validLines = lines.filter((line) => !line.problem);
  const subtotal = validLines.reduce((sum, line) => sum + line.lineTotalKurus, 0);

  let couponApplied = false;
  let couponMessage: string | null = null;
  let couponId: string | null = null;
  let effect = null;
  if (cart?.couponCode) {
    const coupon = await db.coupon.findUnique({ where: { code: cart.couponCode } });
    const email = options.email ?? options.user?.email ?? null;
    const emailUsageCount =
      coupon && email && coupon.usageLimitPerEmail !== null
        ? await db.couponRedemption.count({ where: { couponId: coupon.id, email } })
        : undefined;
    const check = evaluateCoupon(coupon, { subtotalKurus: subtotal, now: new Date(), emailUsageCount }, formatTRY);
    if (check.ok) {
      couponApplied = true;
      couponId = coupon?.id ?? null;
      effect = check.effect;
    } else {
      couponMessage = check.message;
    }
  }

  const totals = calculateTotals(
    validLines.map((line) => ({
      unitPriceKurus: line.unitPriceKurus,
      quantity: line.quantity,
      vatRate: line.vatRate,
      freeShipping: line.freeShipping,
    })),
    shippingConfig(settings),
    effect,
  );

  const problems = lines.filter((line) => line.problem).map((line) => `${line.productName}: ${line.problem}`);

  return {
    cartId: cart?.id ?? null,
    lines,
    totals,
    couponCode: cart?.couponCode ?? null,
    couponApplied,
    couponMessage,
    couponId,
    problems,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}

export async function getCurrentPricedCart(email?: string | null) {
  const user = await getCurrentUser();
  const cart = await findCurrentCart(user);
  return priceCart(cart, { user, email });
}

export type CartMutationResult = { ok: true } | { ok: false; message: string };

async function loadPurchasableVariant(variantId: string) {
  return db.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { status: true, saleStatus: true, name: true } } },
  });
}

export async function addToCart(variantId: string, quantity: number): Promise<CartMutationResult> {
  const variant = await loadPurchasableVariant(variantId);
  if (!variant || variant.product.status !== "ACTIVE" || !variant.isActive || variant.priceKurus <= 0) {
    return { ok: false, message: "Bu ürün şu anda satın alınamıyor." };
  }
  const availability = variantAvailability(variant, variant.product.saleStatus);
  if (availability === "COMING_SOON") return { ok: false, message: "Bu ürün henüz satışa açılmadı." };
  if (!isPurchasable(availability)) return { ok: false, message: "Bu ürün stokta kalmadı." };

  const cartId = await getOrCreateCartId();
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
  const desired = (existing?.quantity ?? 0) + quantity;
  const maxQty = maxPurchasableQty(variant);
  if (desired > maxQty) {
    return {
      ok: false,
      message:
        existing && existing.quantity >= maxQty
          ? `Sepetinizde bu üründen zaten en fazla adet (${maxQty}) bulunuyor.`
          : `Bu üründen en fazla ${maxQty} adet sipariş edilebilir.`,
    };
  }
  const finalQty = Math.max(desired, variant.minOrderQty);
  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity: finalQty },
    update: { quantity: finalQty },
  });
  await db.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
  return { ok: true };
}

export async function updateCartItemQuantity(variantId: string, quantity: number): Promise<CartMutationResult> {
  const cart = await findCurrentCart();
  if (!cart) return { ok: false, message: "Sepet bulunamadı." };
  if (quantity <= 0) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
    return { ok: true };
  }
  const variant = await loadPurchasableVariant(variantId);
  if (!variant) return { ok: false, message: "Ürün bulunamadı." };
  const maxQty = maxPurchasableQty(variant);
  if (quantity > maxQty) return { ok: false, message: `Bu üründen en fazla ${maxQty} adet sipariş edilebilir.` };
  if (quantity < variant.minOrderQty) return { ok: false, message: `Bu ürün en az ${variant.minOrderQty} adet sipariş edilebilir.` };
  await db.cartItem.updateMany({ where: { cartId: cart.id, variantId }, data: { quantity } });
  return { ok: true };
}

export async function removeCartItem(variantId: string): Promise<CartMutationResult> {
  const cart = await findCurrentCart();
  if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
  return { ok: true };
}

/** Sepetteki sorunları giderir: satışta olmayanları çıkarır, adetleri stok/minimuma uyarlar */
export async function fixCartProblems(): Promise<void> {
  const user = await getCurrentUser();
  const cart = await findCurrentCart(user);
  if (!cart) return;
  const priced = await priceCart(cart, { user });
  const operations: Prisma.PrismaPromise<unknown>[] = [];
  for (const line of priced.lines) {
    if (line.problemCode === "UNAVAILABLE") {
      operations.push(db.cartItem.delete({ where: { id: line.itemId } }));
    } else if (line.problemCode === "OVER_MAX") {
      operations.push(
        line.maxQty >= line.minQty
          ? db.cartItem.update({ where: { id: line.itemId }, data: { quantity: line.maxQty } })
          : db.cartItem.delete({ where: { id: line.itemId } }),
      );
    } else if (line.problemCode === "UNDER_MIN") {
      operations.push(
        line.minQty <= line.maxQty
          ? db.cartItem.update({ where: { id: line.itemId }, data: { quantity: line.minQty } })
          : db.cartItem.delete({ where: { id: line.itemId } }),
      );
    }
  }
  if (operations.length) await db.$transaction(operations);
}

export async function setCartCoupon(code: string | null): Promise<void> {
  const cartId = await getOrCreateCartId();
  await db.cart.update({ where: { id: cartId }, data: { couponCode: code } });
}

/** Giriş/kayıt sonrası misafir sepetini kullanıcı sepetine taşır */
export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const token = await readGuestToken();
  if (!token) return;
  const guest = await db.cart.findUnique({ where: { tokenHash: sha256Hex(token) }, include: { items: true } });
  if (guest && guest.items.length > 0) {
    const userCart = await db.cart.upsert({ where: { userId }, create: { userId }, update: {}, include: { items: true } });
    await db.$transaction(async (tx) => {
      for (const item of guest.items) {
        const existing = userCart.items.find((i) => i.variantId === item.variantId);
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant) continue;
        const quantity = Math.min((existing?.quantity ?? 0) + item.quantity, Math.max(1, maxPurchasableQty(variant)));
        await tx.cartItem.upsert({
          where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
          create: { cartId: userCart.id, variantId: item.variantId, quantity },
          update: { quantity },
        });
      }
      if (guest.couponCode && !userCart.couponCode) {
        await tx.cart.update({ where: { id: userCart.id }, data: { couponCode: guest.couponCode } });
      }
      await tx.cart.delete({ where: { id: guest.id } });
    });
  } else if (guest) {
    await db.cart.delete({ where: { id: guest.id } });
  }
  const store = await cookies();
  store.delete(CART_COOKIE);
}

export async function clearCart(cartId: string): Promise<void> {
  await db.$transaction([
    db.cartItem.deleteMany({ where: { cartId } }),
    db.cart.update({ where: { id: cartId }, data: { couponCode: null } }),
  ]);
}

/** Önceki siparişi sepete yeniden ekler (güncel fiyat ve stokla) */
export async function addOrderItemsToCart(items: Array<{ variantId: string | null; quantity: number }>) {
  const added: string[] = [];
  const skipped: string[] = [];
  for (const item of items) {
    if (!item.variantId) {
      skipped.push("Satıştan kaldırılmış ürün");
      continue;
    }
    const result = await addToCart(item.variantId, item.quantity);
    if (result.ok) added.push(item.variantId);
    else {
      const variant = await db.productVariant.findUnique({ where: { id: item.variantId }, include: { product: { select: { name: true } } } });
      skipped.push(`${variant?.product.name ?? "Ürün"}: ${result.message}`);
    }
  }
  return { added: added.length, skipped };
}
