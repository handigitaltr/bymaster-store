import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { findCurrentCart } from "@/lib/cart";

export const dynamic = "force-dynamic";

/** Statik sayfalardaki başlık için: oturum ve sepet adedi (kişisel veri içermez) */
export async function GET() {
  const user = await getCurrentUser();
  const cart = await findCurrentCart(user);
  let cartCount = 0;
  if (cart) {
    const agg = await db.cartItem.aggregate({ where: { cartId: cart.id }, _sum: { quantity: true } });
    cartCount = agg._sum.quantity ?? 0;
  }
  return NextResponse.json(
    { user: user ? { firstName: user.name.split(" ")[0], isAdmin: user.role === "ADMIN" } : null, cartCount },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
