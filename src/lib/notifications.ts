import "server-only";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/env";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { backInStockEmail } from "@/lib/email/templates";
import { getSettings } from "@/lib/settings";

/**
 * "Gelince haber ver" listesindekilere e-posta gönderir. E-posta yapılandırılmamışsa kayıtlar
 * bildirilmemiş olarak kalır (sonradan gönderilebilir).
 */
export async function notifyBackInStock(variantIds: string[]) {
  if (variantIds.length === 0 || !isEmailConfigured()) return 0;
  const settings = await getSettings();
  const pending = await db.stockNotification.findMany({
    where: { variantId: { in: variantIds }, notifiedAt: null },
    include: { variant: { include: { product: { select: { name: true, slug: true, status: true } } } } },
    take: 500,
  });
  let sent = 0;
  for (const notification of pending) {
    if (notification.variant.product.status !== "ACTIVE") continue;
    const ok = await sendEmail(
      notification.email,
      backInStockEmail(notification.variant.product.name, absoluteUrl(`/urun/${notification.variant.product.slug}`), settings.storeName),
      "back-in-stock",
    );
    if (ok) {
      await db.stockNotification.update({ where: { id: notification.id }, data: { notifiedAt: new Date() } });
      sent++;
    }
  }
  return sent;
}
