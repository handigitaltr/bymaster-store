"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { assertAdmin } from "@/lib/auth/guards";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { db } from "@/lib/db";
import type { AdminFormState } from "@/lib/admin-form";
import { sendOrderPaidEmails, transitionOrder } from "@/lib/orders";
import { revalidateStorefront } from "@/lib/revalidate";
import { z } from "@/lib/validation";

const transitionSchema = z.object({
  orderId: z.string().min(10).max(40),
  to: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
  shippingCarrier: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(80).optional(),
  trackingUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine((value) => !value || /^https:\/\//.test(value), "Takip bağlantısı https:// ile başlamalıdır."),
  notify: z.string().optional(),
});

export async function transitionOrderAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = transitionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Geçersiz istek." };
  const result = await transitionOrder(parsed.data.orderId, parsed.data.to as OrderStatus, {
    actorId: admin.id,
    note: parsed.data.note,
    shippingCarrier: parsed.data.shippingCarrier,
    trackingNumber: parsed.data.trackingNumber,
    trackingUrl: parsed.data.trackingUrl,
    notifyCustomer: parsed.data.notify === "on",
  });
  if (!result.ok) return { message: result.message };
  revalidatePath(`/yonetim/siparisler/${parsed.data.orderId}`);
  revalidatePath("/yonetim/siparisler");
  if (parsed.data.to === "CANCELLED") revalidateStorefront();
  return { ok: true, message: "Sipariş durumu güncellendi." };
}

export async function saveOrderNoteAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = z.object({ orderId: z.string().min(10).max(40), adminNote: z.string().trim().max(2000) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Geçersiz istek." };
  await db.order.update({ where: { id: parsed.data.orderId }, data: { adminNote: parsed.data.adminNote || null } });
  await audit(admin.id, "order.note", "Order", parsed.data.orderId);
  revalidatePath(`/yonetim/siparisler/${parsed.data.orderId}`);
  return { ok: true, message: "Not kaydedildi." };
}

export async function recordRefundAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await assertAdmin();
  const parsed = z
    .object({ orderId: z.string().min(10).max(40), kind: z.enum(["REFUNDED", "PARTIALLY_REFUNDED"]), note: z.string().trim().min(3, "Açıklama girin (ör. iade referansı).").max(500) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Geçersiz istek." };
  const order = await db.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order || order.paymentStatus !== "PAID" && order.paymentStatus !== "PARTIALLY_REFUNDED") {
    return { message: "Yalnızca ödemesi alınmış siparişlerde iade kaydı oluşturulabilir." };
  }
  await db.$transaction([
    db.order.update({ where: { id: order.id }, data: { paymentStatus: parsed.data.kind } }),
    db.orderStatusEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: order.status,
        note: `${parsed.data.kind === "REFUNDED" ? "Ücret iadesi yapıldı" : "Kısmi ücret iadesi yapıldı"}: ${parsed.data.note}`,
        actorId: admin.id,
      },
    }),
  ]);
  await audit(admin.id, "order.refund", "Order", order.id, parsed.data.note);
  revalidatePath(`/yonetim/siparisler/${order.id}`);
  return { ok: true, message: "İade kaydı oluşturuldu. Ödeme sağlayıcısı panelinden iadeyi gerçekleştirdiğinizden emin olun." };
}

export async function resendConfirmationAction(formData: FormData): Promise<void> {
  const admin = await assertAdmin();
  const orderId = z.string().min(10).max(40).parse(formData.get("orderId"));
  const order = await db.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true } });
  if (order?.paymentStatus === "PAID") {
    await sendOrderPaidEmails(orderId);
    await audit(admin.id, "order.resend_email", "Order", orderId);
  }
  revalidatePath(`/yonetim/siparisler/${orderId}`);
}
