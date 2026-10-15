import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canAccessOrder } from "@/lib/order-access";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  if (!/^BM[0-9A-Z]{8,14}$/.test(orderNumber)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const order = await db.order.findUnique({ where: { orderNumber }, select: { id: true, userId: true, status: true, paymentStatus: true } });
  const user = await getCurrentUser();
  if (!order || !(await canAccessOrder(order, user))) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ status: order.status, paymentStatus: order.paymentStatus }, { headers: { "Cache-Control": "private, no-store" } });
}
