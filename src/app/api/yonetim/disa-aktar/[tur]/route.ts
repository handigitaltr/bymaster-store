import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { audit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/guards";
import { ORDER_STATUS_LABELS, ORDER_STATUSES, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { csvMoney, toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { formatPhoneForDisplay } from "@/lib/text";

export const dynamic = "force-dynamic";

const MAX_ROWS = 10_000;

const QUOTE_STATUS_LABELS: Record<string, string> = {
  NEW: "Yeni",
  IN_REVIEW: "İnceleniyor",
  QUOTED: "Teklif verildi",
  WON: "Kazanıldı",
  LOST: "Kaybedildi",
  CLOSED: "Kapandı",
};

function fileResponse(name: string, csv: string) {
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bymaster-${name}-${date}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ tur: string }> }) {
  // Yetki kontrolü sunucuda: yalnızca yönetici hesapları kişisel veri içeren dışa aktarımları alabilir
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  const { tur } = await params;
  const url = new URL(request.url);

  if (tur === "siparisler") {
    const durum = url.searchParams.get("durum");
    const days = Number(url.searchParams.get("gun"));
    const q = url.searchParams.get("q")?.trim();
    const where: Prisma.OrderWhereInput = {
      ...(durum && (ORDER_STATUSES as readonly string[]).includes(durum) ? { status: durum } : {}),
      ...(url.searchParams.get("test") === "gizle" ? { isTest: false } : {}),
      ...(Number.isInteger(days) && days > 0 && days <= 3660 ? { createdAt: { gte: new Date(Date.now() - days * 86_400_000) } } : {}),
      ...(q ? { OR: [{ orderNumber: { contains: q.toUpperCase() } }, { email: { contains: q.toLowerCase() } }, { customerName: { contains: q } }] } : {}),
    };
    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
      include: { items: { select: { productName: true, variantName: true, sku: true, quantity: true } } },
    });
    const csv = toCsv(
      [
        "Sipariş no",
        "Tarih",
        "Durum",
        "Ödeme durumu",
        "Ödeme yöntemi",
        "Test",
        "Müşteri",
        "E-posta",
        "Telefon",
        "İl",
        "İlçe",
        "Teslimat adresi",
        "Fatura tipi",
        "Firma",
        "Vergi dairesi",
        "Vergi / TC no",
        "Ürünler",
        "Ara toplam",
        "İndirim",
        "Kupon",
        "Kargo",
        "KDV",
        "Toplam",
        "Ödeme tarihi",
        "Kargo firması",
        "Takip no",
      ],
      orders.map((order) => [
        order.orderNumber,
        order.createdAt,
        ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status,
        PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus,
        PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod,
        order.isTest,
        order.customerName,
        order.email,
        formatPhoneForDisplay(order.phone),
        order.shipCity,
        order.shipDistrict,
        order.shipAddressLine,
        order.billType === "CORPORATE" ? "Kurumsal" : "Bireysel",
        order.billCompanyName,
        order.billTaxOffice,
        order.billTaxNumber,
        order.items.map((item) => `${item.quantity} × ${item.productName} (${item.variantName}, ${item.sku})`).join(" | "),
        csvMoney(order.subtotalKurus),
        csvMoney(order.discountKurus),
        order.couponCode,
        csvMoney(order.shippingKurus),
        csvMoney(order.vatKurus),
        csvMoney(order.totalKurus),
        order.paidAt,
        order.shippingCarrier,
        order.trackingNumber,
      ]),
    );
    await audit(user.id, "export.orders", "Order", null, `${orders.length} satır`);
    return fileResponse("siparisler", csv);
  }

  if (tur === "bulten") {
    const status = url.searchParams.get("durum") === "tum" ? undefined : "ACTIVE";
    const rows = await db.newsletterSubscription.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: MAX_ROWS });
    const csv = toCsv(
      ["E-posta", "Durum", "Kaynak", "Abonelik tarihi", "Ayrılma tarihi", "Onay metni"],
      rows.map((row) => [row.email, row.status === "ACTIVE" ? "Aktif" : "Ayrıldı", row.source, row.createdAt, row.unsubscribedAt, row.consentText]),
    );
    await audit(user.id, "export.newsletter", "NewsletterSubscription", null, `${rows.length} satır`);
    return fileResponse("bulten", csv);
  }

  if (tur === "teklifler") {
    const rows = await db.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
      include: { items: { select: { productName: true, variantName: true, quantity: true, unit: true } } },
    });
    const csv = toCsv(
      ["Referans", "Tarih", "Durum", "İşletme", "Yetkili", "E-posta", "Telefon", "İl", "İşletme türü", "Ürünler", "Mesaj"],
      rows.map((row) => [
        row.referenceNo,
        row.createdAt,
        QUOTE_STATUS_LABELS[row.status] ?? row.status,
        row.companyName,
        row.contactName,
        row.email,
        formatPhoneForDisplay(row.phone),
        row.city,
        row.businessType,
        row.items.map((item) => `${item.quantity} ${item.unit} ${item.productName}${item.variantName ? ` (${item.variantName})` : ""}`).join(" | "),
        row.message,
      ]),
    );
    await audit(user.id, "export.quotes", "QuoteRequest", null, `${rows.length} satır`);
    return fileResponse("teklifler", csv);
  }

  return NextResponse.json({ error: "Bilinmeyen dışa aktarım türü" }, { status: 404 });
}
