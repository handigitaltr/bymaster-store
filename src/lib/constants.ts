// Uygulama genelindeki durum değerleri ve Türkçe etiketleri.
// Veritabanında metin olarak saklanan alanların tek doğruluk kaynağıdır.

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "AWAITING_TRANSFER",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "EXPIRED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Ödeme bekleniyor",
  AWAITING_TRANSFER: "Havale/EFT bekleniyor",
  PAID: "Ödeme alındı",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoya verildi",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
  EXPIRED: "Süresi doldu",
};

/** Yöneticinin elle yapabileceği durum geçişleri */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  AWAITING_TRANSFER: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  EXPIRED: [],
};

/** Stok rezervasyonu hâlâ geçerli olan (ödenmemiş) durumlar */
export const UNPAID_OPEN_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "AWAITING_TRANSFER"];
/** Ödemesi alınmış ve satış sayılan durumlar (raporlar için) */
export const PAID_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Ödenmedi",
  PAID: "Ödendi",
  FAILED: "Başarısız",
  REFUNDED: "İade edildi",
  PARTIALLY_REFUNDED: "Kısmi iade",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: "Kredi / banka kartı",
  BANK_TRANSFER: "Havale / EFT",
};

export const PACKAGE_TYPES = ["KOVA", "PAKET", "KUTU", "SISE", "KOLI"] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];
export const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  KOVA: "Kova",
  PAKET: "Paket",
  KUTU: "Kutu",
  SISE: "Şişe",
  KOLI: "Koli",
};

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  ACTIVE: "Yayında",
  ARCHIVED: "Arşivde",
};
export const SALE_STATUSES = ["AVAILABLE", "COMING_SOON"] as const;
export const SALE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Satışta",
  COMING_SOON: "Yakında",
};
export const PRODUCT_KINDS = ["SIMPLE", "KIT"] as const;

export const TAG_TYPES = ["FLAVOR", "USAGE"] as const;
export const TAG_TYPE_LABELS: Record<string, string> = {
  FLAVOR: "Lezzet ailesi",
  USAGE: "Kullanım alanı",
};

export const BLOG_POST_TYPES = ["ARTICLE", "RECIPE", "GUIDE"] as const;
export const BLOG_POST_TYPE_LABELS: Record<string, string> = {
  ARTICLE: "Yazı",
  RECIPE: "Tarif",
  GUIDE: "Rehber",
};
export const CONTENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
};

export const QUOTE_STATUSES = ["NEW", "IN_REVIEW", "QUOTED", "WON", "LOST", "CLOSED"] as const;
export const QUOTE_STATUS_LABELS: Record<string, string> = {
  NEW: "Yeni",
  IN_REVIEW: "İnceleniyor",
  QUOTED: "Teklif verildi",
  WON: "Siparişe dönüştü",
  LOST: "Olumsuz",
  CLOSED: "Kapatıldı",
};
export const QUOTE_UNITS = ["KOVA", "KOLI", "PAKET", "ADET", "KG"] as const;
export const QUOTE_UNIT_LABELS: Record<string, string> = {
  KOVA: "Kova",
  KOLI: "Koli",
  PAKET: "Paket",
  ADET: "Adet",
  KG: "kg",
};

export const BUSINESS_TYPES = [
  "Kafe",
  "Waffle / krep dükkânı",
  "Pastane",
  "Restoran",
  "Otel",
  "Tatlı üreticisi",
  "Catering",
  "Yeni girişim",
  "Diğer",
] as const;

export const RETURN_REASONS = ["DAMAGED", "WRONG_ITEM", "MISSING_ITEM", "QUALITY", "OTHER"] as const;
export const RETURN_REASON_LABELS: Record<string, string> = {
  DAMAGED: "Ürün hasarlı ulaştı",
  WRONG_ITEM: "Yanlış ürün gönderildi",
  MISSING_ITEM: "Eksik ürün",
  QUALITY: "Kalite sorunu",
  OTHER: "Diğer",
};
export const RETURN_STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED", "CLOSED"] as const;
export const RETURN_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Talep alındı",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  RECEIVED: "Ürün teslim alındı",
  REFUNDED: "Ücret iadesi yapıldı",
  CLOSED: "Kapatıldı",
};

export const COUPON_TYPES = ["PERCENT", "FIXED", "FREE_SHIPPING"] as const;
export const COUPON_TYPE_LABELS: Record<string, string> = {
  PERCENT: "Yüzde indirim",
  FIXED: "Sabit tutar indirimi",
  FREE_SHIPPING: "Ücretsiz kargo",
};

export const INVENTORY_REASON_LABELS: Record<string, string> = {
  ADJUSTMENT: "Stok düzeltme",
  RESTOCK: "Stok girişi",
  ORDER_RESERVED: "Sipariş (rezerve)",
  ORDER_RELEASED: "Sipariş iptali / süre aşımı",
  RETURN: "İade",
  CORRECTION: "Sayım düzeltmesi",
};

export const CONTACT_SUBJECTS = [
  "Sipariş ve teslimat",
  "Ürün bilgisi",
  "Toptan ve iş birliği",
  "İade ve değişim",
  "Diğer",
] as const;

/** 81 il (plaka sırasıyla) */
export const TR_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
  "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri",
  "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
  "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
  "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye",
  "Düzce",
] as const;

export const SORTED_TR_CITIES = [...TR_CITIES].sort((a, b) => a.localeCompare(b, "tr"));

export const PAGE_SIZE = 12;
