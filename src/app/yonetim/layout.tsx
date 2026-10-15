import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { paymentModeLabel, getCardProviderId } from "@/lib/payments/config";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s · Yönetim · ByMaster" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [newQuotes, newMessages, openReturns, awaitingOrders] = await Promise.all([
    db.quoteRequest.count({ where: { status: "NEW" } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.returnRequest.count({ where: { status: "REQUESTED" } }),
    db.order.count({ where: { status: { in: ["PAID", "AWAITING_TRANSFER"] } } }),
  ]);
  return (
    <AdminShell
      userName={user.name}
      badges={{ orders: awaitingOrders, quotes: newQuotes, messages: newMessages, returns: openReturns }}
      paymentMode={getCardProviderId() ? paymentModeLabel() : null}
    >
      {children}
    </AdminShell>
  );
}
