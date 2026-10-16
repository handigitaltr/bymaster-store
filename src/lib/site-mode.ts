// Derleme modu. NEXT_PUBLIC_STATIC_SITE=1 ile GitHub Pages için statik vitrin üretilir (scripts/build-pages.mjs):
// sunucu gerektiren sepet, ödeme, üyelik, arama, bülten ve yönetim bölümleri bu derlemede yer almaz.
// Değerler derleme anında sabitlenir; tam sitede (normal derleme) STATIC_SITE her zaman false'tur.
export const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC_SITE === "1";

/** Sitenin alan adı altındaki yolu (GitHub Pages: "/depo-adi"); tam sitede boştur */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Statik vitrinde satın alma yerine gösterilen bilgi */
export const STATIC_SALES_NOTE = "Online sipariş yakında açılacak.";
