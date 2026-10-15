import "server-only";
import { PAID_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { isEmailConfigured } from "@/lib/email";
import { getCardProviderId, PROVIDER_LABELS } from "@/lib/payments/config";
import { getSettings, LEGAL_PAGE_SLUGS, missingSellerFields, parseBankAccounts } from "@/lib/settings";

export type ChecklistItem = { label: string; status: "ok" | "warn" | "todo"; detail: string; href: string };

export async function getGoLiveChecklist(): Promise<ChecklistItem[]> {
  const settings = await getSettings();
  const pages = await db.page.findMany({ select: { slug: true, status: true } });
  const published = (slug: string) => pages.some((page) => page.slug === slug && page.status === "PUBLISHED");
  const provider = getCardProviderId();
  const bankAccounts = settings.bankTransferEnabled ? parseBankAccounts(settings.bankAccountsJson) : [];
  const missingSeller = missingSellerFields(settings);

  const [missingFoodInfo, untrackedStock, placeholderProducts, activeProducts] = await Promise.all([
    db.product.count({ where: { status: "ACTIVE", OR: [{ allergens: null }, { ingredients: null }] } }),
    db.productVariant.count({ where: { isActive: true, trackStock: false, product: { status: "ACTIVE" } } }),
    db.product.count({ where: { status: "ACTIVE", images: { some: { isPlaceholder: true } } } }),
    db.product.count({ where: { status: "ACTIVE" } }),
  ]);

  const items: ChecklistItem[] = [
    {
      label: "Satıcı (şirket) bilgileri",
      status: missingSeller.length ? "todo" : "ok",
      detail: missingSeller.length ? `Eksik: ${missingSeller.join(", ")}` : "Sözleşmelerde kullanılacak bilgiler tamam.",
      href: "/yonetim/ayarlar",
    },
    {
      label: "Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi",
      status: published(LEGAL_PAGE_SLUGS.preInformation) && published(LEGAL_PAGE_SLUGS.distanceSales) ? "ok" : "todo",
      detail: "Yayınlanmadan sipariş alınmaz. Taslakları hukuki danışmanınızla kontrol edip yayınlayın.",
      href: "/yonetim/sayfalar",
    },
    {
      label: "KVKK, gizlilik ve çerez metinleri",
      status: published(LEGAL_PAGE_SLUGS.kvkk) && published(LEGAL_PAGE_SLUGS.privacy) && published(LEGAL_PAGE_SLUGS.cookies) ? "ok" : "todo",
      detail: "Formlarda ve alt bilgide bağlantı verilir.",
      href: "/yonetim/sayfalar",
    },
    {
      label: "İade/iptal ve kargo/teslimat sayfaları",
      status: published(LEGAL_PAGE_SLUGS.returns) && published(LEGAL_PAGE_SLUGS.shipping) ? "ok" : "warn",
      detail: "Müşterilerin sık baktığı bilgilendirme sayfaları.",
      href: "/yonetim/sayfalar",
    },
    {
      label: "Ödeme yöntemi",
      status: provider ? (env.PAYMENT_MODE === "live" && provider !== "mock" ? "ok" : "warn") : bankAccounts.length ? "warn" : "todo",
      detail: provider
        ? `${PROVIDER_LABELS[provider]} · ${env.PAYMENT_MODE === "live" ? "canlı mod" : "TEST MODU — gerçek tahsilat yapılmaz"}`
        : bankAccounts.length
          ? "Yalnızca havale/EFT etkin. Kartla ödeme için PayTR veya iyzico anahtarlarını sunucu ortamına girin."
          : "Kart sağlayıcısı veya havale hesabı tanımlı değil.",
      href: "/yonetim/ayarlar#odeme",
    },
    {
      label: "Kargo ücreti",
      status: settings.shippingFeeKurus !== null ? "ok" : "todo",
      detail: settings.shippingFeeKurus !== null ? "Tanımlı." : "Kargo ücreti tanımlanmadan (ücretsiz kargolu kitler dışında) sipariş alınamaz.",
      href: "/yonetim/ayarlar#kargo",
    },
    {
      label: "E-posta gönderimi (SMTP)",
      status: isEmailConfigured() ? "ok" : "todo",
      detail: isEmailConfigured() ? "Sipariş ve bildirim e-postaları gönderilir." : "Sipariş onayı, şifre sıfırlama ve bildirim e-postaları gönderilemez.",
      href: "/yonetim/ayarlar#eposta",
    },
    {
      label: "Sipariş bildirim e-postası",
      status: settings.orderNotificationEmail ? "ok" : "warn",
      detail: settings.orderNotificationEmail ?? "Yeni sipariş ve taleplerden haberdar olacağınız adres.",
      href: "/yonetim/ayarlar",
    },
    {
      label: "Ürün içerik ve alerjen bilgileri",
      status: missingFoodInfo === 0 ? "ok" : "todo",
      detail: missingFoodInfo === 0 ? "Tüm ürünlerde girilmiş." : `${missingFoodInfo} / ${activeProducts} yayındaki üründe içindekiler veya alerjen bilgisi eksik.`,
      href: "/yonetim/urunler?eksik=bilgi",
    },
    {
      label: "Stok takibi",
      status: untrackedStock === 0 ? "ok" : "warn",
      detail: untrackedStock === 0 ? "Tüm ürünlerde açık." : `${untrackedStock} varyantta stok takibi kapalı (stok sınırı uygulanmıyor).`,
      href: "/yonetim/stok",
    },
    {
      label: "Ürün fotoğrafları",
      status: placeholderProducts === 0 ? "ok" : "warn",
      detail: placeholderProducts === 0 ? "Tüm ürünlerde gerçek fotoğraf var." : `${placeholderProducts} üründe temsili illüstrasyon kullanılıyor.`,
      href: "/yonetim/urunler?eksik=gorsel",
    },
    {
      label: "ETBİS kaydı",
      status: settings.etbisUrl ? "ok" : "warn",
      detail: settings.etbisUrl ? "Bağlantı alt bilgide gösteriliyor." : "E-ticaret sitelerinin ETBİS'e kayıt olması gerekir; kayıt bağlantısını ayarlara ekleyin.",
      href: "/yonetim/ayarlar",
    },
  ];
  return items;
}

export async function getDashboardStats() {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [paid30, paid7, awaitingTransfer, toShip, pendingPayment, lowStock, recentOrders] = await Promise.all([
    db.order.aggregate({ where: { status: { in: PAID_STATUSES }, paidAt: { gte: since30 }, isTest: false }, _sum: { totalKurus: true }, _count: true }),
    db.order.aggregate({ where: { status: { in: PAID_STATUSES }, paidAt: { gte: since7 }, isTest: false }, _sum: { totalKurus: true }, _count: true }),
    db.order.count({ where: { status: "AWAITING_TRANSFER" } }),
    db.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
    db.order.count({ where: { status: "PENDING_PAYMENT" } }),
    db.productVariant.findMany({
      where: { isActive: true, trackStock: true, product: { status: "ACTIVE" } },
      select: { id: true, name: true, stock: true, lowStockThreshold: true, product: { select: { name: true, id: true } } },
      orderBy: { stock: "asc" },
      take: 50,
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, orderNumber: true, customerName: true, totalKurus: true, status: true, createdAt: true, isTest: true, paymentMethod: true },
    }),
  ]);
  return {
    revenue30: paid30._sum.totalKurus ?? 0,
    orders30: paid30._count,
    revenue7: paid7._sum.totalKurus ?? 0,
    orders7: paid7._count,
    awaitingTransfer,
    toShip,
    pendingPayment,
    lowStock: lowStock.filter((variant) => variant.stock <= variant.lowStockThreshold).slice(0, 8),
    recentOrders,
  };
}
