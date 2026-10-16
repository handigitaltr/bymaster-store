// Katalog başlangıç verisi.
// Kaynaklar: ByMaster fiyat listesi (fiyat, ambalaj, KDV oranı), ürün ve kampanya görselleri (ürün adları,
// etiket ibareleri, kit içerikleri). İçindekiler, alerjen ve saklama bilgileri kaynaklarda bulunmadığından
// BİLEREK boş bırakılmıştır; yönetim panelinden girilmelidir.

export type SeedCategory = {
  slug: string;
  name: string;
  shortName?: string;
  description: string;
  menuGroup: string;
  imageUrl: string;
  imageAlt: string;
  accentColor: string;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
};

export const categories: SeedCategory[] = [
  {
    slug: "waffle-soslari",
    name: "Waffle Sosları",
    description: "Sütlü, bitter, beyaz, Antep fıstıklı, frambuazlı ve Lotus waffle sosları; 10 kg profesyonel kova ambalajda.",
    menuGroup: "Soslar",
    imageUrl: "/images/products/antep-fistikli-waffle-sosu-kova.webp",
    imageAlt: "ByMaster Antep Fıstıklı Waffle Sosu kovası",
    accentColor: "#351C16",
    sortOrder: 10,
    seoTitle: "Waffle Sosları — 10 kg Profesyonel Kova",
    seoDescription:
      "ByMaster waffle sosları: sütlü, bitter, beyaz, Antep fıstıklı, frambuazlı ve Lotus. Kafe ve pastaneler için 10 kg kova ambalaj.",
  },
  {
    slug: "cikolata-soslari",
    name: "Çikolata ve Premium Soslar",
    shortName: "Çikolata Sosları",
    description: "Sütlü ve bitter waffle sosları ile Premium Çikolata Bazı; çikolata ağırlıklı sunumlar için.",
    menuGroup: "Soslar",
    imageUrl: "/images/products/sutlu-waffle-sosu-kova.webp",
    imageAlt: "ByMaster Sütlü Waffle Sosu kovası",
    accentColor: "#781F2B",
    sortOrder: 20,
    seoTitle: "Çikolata Sosları ve Premium Çikolata Bazı",
    seoDescription: "Sütlü ve bitter çikolata waffle sosları ile ByMaster Premium Çikolata Bazı. 10 kg kova ambalaj.",
  },
  {
    slug: "meyveli-soslar",
    name: "Meyveli Soslar",
    description: "Çikolatalı sunumlara ferah bir karşılık: frambuazlı waffle sosu.",
    menuGroup: "Soslar",
    imageUrl: "/images/products/frambuazli-waffle-sosu-kova.webp",
    imageAlt: "ByMaster Frambuazlı Waffle Sosu kovası",
    accentColor: "#8E2A3B",
    sortOrder: 30,
    seoTitle: "Meyveli Soslar — Frambuazlı Waffle Sosu",
    seoDescription: "ByMaster Frambuazlı Waffle Sosu; waffle, krep ve dondurma sunumları için 10 kg kova.",
  },
  {
    slug: "pirinc-patlaklari",
    name: "Pirinç Patlakları",
    description: "Metalik, çikolatalı ve meyveli renk seçenekleriyle 1 kg paketlerde pirinç patlakları.",
    menuGroup: "Süslemeler",
    imageUrl: "/images/products/pirinc-patlagi-metalik-karisik.webp",
    imageAlt: "Karışık renkli metalik pirinç patlağı paketi",
    accentColor: "#F2E6D5",
    sortOrder: 40,
    seoTitle: "Pirinç Patlakları — Metalik ve Çikolatalı Renkler",
    seoDescription: "Waffle, pasta ve dondurma süslemesi için 16 farklı pirinç patlağı seçeneği, 1 kg paket.",
  },
  {
    slug: "krep-kiriklari",
    name: "Krep Kırıkları",
    description: "Sade, çilekli, karamelli, Oreo ve Antep fıstıklı krep kırıkları; 2,5 kg paket.",
    menuGroup: "Süslemeler",
    imageUrl: "/images/products/krep-kirigi-cilek.webp",
    imageAlt: "Çilekli krep kırığı paketi",
    accentColor: "#BC8855",
    sortOrder: 50,
    seoTitle: "Krep Kırıkları — 2,5 kg Paket",
    seoDescription: "Sade, çilekli, karamelli, Oreo ve Antep fıstıklı krep kırıkları. Waffle ve tatlı süslemesi için 2,5 kg paket.",
  },
  {
    slug: "sekerlemeler-ve-toppingler",
    name: "Şekerlemeler ve Toppingler",
    shortName: "Şekerlemeler",
    description: "Minibon ve çakıltaşı şekerlemeleriyle renkli sunumlar; 1 kg paket.",
    menuGroup: "Süslemeler",
    imageUrl: "/images/products/cakiltasi.webp",
    imageAlt: "Çakıltaşı şekerleme paketi",
    accentColor: "#FBF6EF",
    sortOrder: 60,
    seoTitle: "Şekerlemeler ve Toppingler",
    seoDescription: "Minibon ve çakıltaşı şekerlemeleri; waffle, dondurma ve pasta süslemesi için 1 kg paket.",
  },
  {
    slug: "waffle-mix-ve-karisimlar",
    name: "Waffle Mix ve Karışımlar",
    shortName: "Karışımlar",
    description: "ByMaster Waffle Mix; 1 kg paket, koli içinde 12 paket.",
    menuGroup: "Karışımlar ve Kitler",
    imageUrl: "/images/products/waffle-mix-koli.webp",
    imageAlt: "ByMaster Bubble Waffle Mix paketi ve kolisi",
    accentColor: "#E9DFD1",
    sortOrder: 70,
    seoTitle: "Waffle Mix ve Karışımlar",
    seoDescription: "ByMaster Waffle Mix 1 kg paket; koli içinde 12 paket. Profesyonel waffle hazırlığı için.",
  },
  {
    slug: "evde-tatli-kitleri",
    name: "Evde Tatlı Kitleri",
    shortName: "Tatlı Kitleri",
    description: "Churros Box, Pankek Box ve Waffle Box: temel malzemeler tek kutuda.",
    menuGroup: "Karışımlar ve Kitler",
    imageUrl: "/images/products/churros-box.webp",
    imageAlt: "ByMaster Churros Box içeriği",
    accentColor: "#C9A57E",
    sortOrder: 80,
    seoTitle: "Evde Tatlı Kitleri — Churros, Pankek ve Waffle Box",
    seoDescription: "ByMaster Churros Box ve Pankek Box ile evde churros ve pankek keyfi. Kitlerde kargo ücretsiz.",
  },
];

export const flavorTags = [
  { slug: "cikolata", name: "Çikolata", color: "#5A3324", description: "Sütlü ve bitter çikolata lezzetleri" },
  { slug: "kuruyemis", name: "Kuruyemiş", color: "#7E9440", description: "Antep fıstığı ve fındık aromalı seçenekler" },
  { slug: "meyve", name: "Meyve", color: "#B4314A", description: "Frambuaz ve çilek" },
  { slug: "biskuvi-karamel", name: "Bisküvi & Karamel", color: "#B87B3E", description: "Lotus, karamel ve bisküvi" },
  { slug: "sade", name: "Sade", color: "#D8C29A", description: "Sade ve nötr dokular" },
  { slug: "renkli-dekoratif", name: "Renkli & Dekoratif", color: "#6B4C9A", description: "Metalik renkler ve şekerlemeler" },
];

export const usageTags = [
  { slug: "waffle", name: "Waffle" },
  { slug: "pankek", name: "Pankek" },
  { slug: "krep", name: "Krep" },
  { slug: "dondurma", name: "Dondurma" },
  { slug: "churros", name: "Churros" },
  { slug: "pasta-kek", name: "Pasta & Kek" },
];

export type SeedImage = { url: string; alt: string; isPlaceholder?: boolean; kind?: string };

export type SeedProduct = {
  slug: string;
  name: string;
  subtitle?: string;
  brand?: string | null;
  kind?: "SIMPLE" | "KIT";
  status?: "ACTIVE" | "DRAFT";
  saleStatus?: "AVAILABLE" | "COMING_SOON";
  primaryCategory: string;
  categories?: string[];
  shortDescription: string;
  description: string;
  usageAreasText?: string;
  usageTips?: string;
  kitContents?: string;
  kitPreparation?: string;
  accentColor: string;
  isFeatured?: boolean;
  freeShipping?: boolean;
  sortOrder: number;
  flavors?: string[];
  usages?: string[];
  images: SeedImage[];
  variant: {
    sku: string;
    name: string;
    packageType: "KOVA" | "PAKET" | "KUTU" | "SISE";
    netWeightGrams?: number;
    unitsPerCase?: number;
    priceKurus: number;
    vatRate: number;
  };
  seoDescription?: string;
};

const SAUCE_USAGES = ["waffle", "pankek", "krep", "dondurma", "churros"];
const TOPPING_USAGES = ["waffle", "pankek", "krep", "dondurma", "pasta-kek"];
const SAUCE_TIPS =
  "Sosu, waffle makineden çıktıktan hemen sonra, sıcak yüzeye gezdirin. Çıtır süslemeleri sosun ardından ve servis anında ekleyerek dokularını koruyun. Kova ambalajda temiz ve kuru servis ekipmanı kullanın; ürün etiketindeki saklama koşullarına uyun.";
const TOPPING_TIPS =
  "Çıtırlığını korumak için servis anında, sosun üzerine serpiştirin. Açılmış paketin ağzını her kullanımdan sonra sıkıca kapatın.";

function sauce(input: {
  slug: string;
  name: string;
  subtitle?: string;
  sku: string;
  price: number;
  image: SeedImage;
  primary?: string;
  categories: string[];
  flavors: string[];
  accent: string;
  sortOrder: number;
  short: string;
  extra?: string;
  usages?: string[];
}): SeedProduct {
  return {
    slug: input.slug,
    name: input.name,
    subtitle: input.subtitle ?? "10 kg kova",
    brand: "ByMaster",
    primaryCategory: input.primary ?? "waffle-soslari",
    categories: input.categories,
    shortDescription: input.short,
    description: `${input.name}; waffle başta olmak üzere krep, pankek ve dondurma sunumlarında kullanılmak üzere 10 kg kova ambalajda sunulur.${input.extra ? ` ${input.extra}` : ""}\n\n10 kg'lık kova ambalaj, sosu yoğun kullanan kafe, pastane ve tatlı dükkânları için uygundur.`,
    usageAreasText: "Waffle, krep, pankek, dondurma ve churros sunumları",
    usageTips: SAUCE_TIPS,
    accentColor: input.accent,
    isFeatured: true,
    sortOrder: input.sortOrder,
    flavors: input.flavors,
    usages: input.usages ?? SAUCE_USAGES,
    images: [input.image],
    variant: { sku: input.sku, name: "10 kg Kova", packageType: "KOVA", netWeightGrams: 10000, priceKurus: input.price, vatRate: 1 },
  };
}

function bead(input: {
  colorName: string;
  slugPart: string;
  skuPart: string;
  accent: string;
  flavor: string;
  sortOrder: number;
  metallic?: boolean;
  images?: SeedImage[];
  featured?: boolean;
}): SeedProduct {
  const label = input.metallic ? `Metalik ${input.colorName}` : input.colorName;
  const name = `Pirinç Patlağı — ${label}`;
  const imageFile = `pirinc-patlagi-${input.slugPart}`;
  return {
    slug: `pirinc-patlagi-${input.slugPart}-1-kg`,
    name,
    subtitle: "1 kg paket",
    brand: null,
    primaryCategory: "pirinc-patlaklari",
    shortDescription: `${label} pirinç patlağı; waffle, dondurma ve pasta süslemesi için 1 kg paket.`,
    description: `${label} renkli pirinç patlağı, tatlı sunumlarına renk ve doku katmak için 1 kg paket hâlinde sunulur. Waffle, dondurma, pasta ve kek süslemelerinde kullanılabilir.`,
    usageAreasText: "Waffle, dondurma, pasta ve kek süslemeleri",
    usageTips: TOPPING_TIPS,
    accentColor: input.accent,
    isFeatured: input.featured ?? false,
    sortOrder: input.sortOrder,
    flavors: [input.flavor],
    usages: TOPPING_USAGES,
    images: input.images ?? [
      { url: `/images/placeholders/${imageFile}.webp`, alt: `${label} pirinç patlağı — temsili illüstrasyon`, isPlaceholder: true },
    ],
    variant: { sku: `PP-${input.skuPart}-1`, name: "1 kg Paket", packageType: "PAKET", netWeightGrams: 1000, priceKurus: 22000, vatRate: 1 },
  };
}

function crepe(input: {
  label: string;
  slugPart: string;
  skuPart: string;
  price: number;
  accent: string;
  flavor: string;
  sortOrder: number;
  featured?: boolean;
}): SeedProduct {
  return {
    slug: `krep-kirigi-${input.slugPart}-2-5-kg`,
    name: `Krep Kırığı — ${input.label}`,
    subtitle: "2,5 kg paket",
    brand: null,
    primaryCategory: "krep-kiriklari",
    shortDescription: `${input.label} krep kırığı; sos üzerine çıtır doku için 2,5 kg paket.`,
    description: `${input.label} krep kırığı, waffle, dondurma ve pasta sunumlarına çıtır bir doku katmak için 2,5 kg paket hâlinde sunulur. İnce yapısı sayesinde sosun üzerinde dengeli bir katman oluşturur.`,
    usageAreasText: "Waffle, dondurma, krep, pasta ve kek süslemeleri",
    usageTips: TOPPING_TIPS,
    accentColor: input.accent,
    isFeatured: input.featured ?? false,
    sortOrder: input.sortOrder,
    flavors: [input.flavor],
    usages: TOPPING_USAGES,
    images: [{ url: `/images/products/krep-kirigi-${input.slugPart}.webp`, alt: `${input.label} krep kırığı paketi` }],
    variant: { sku: `KK-${input.skuPart}-25`, name: "2,5 kg Paket", packageType: "PAKET", netWeightGrams: 2500, priceKurus: input.price, vatRate: 1 },
  };
}

export const products: SeedProduct[] = [
  // ------------------------------------------------------------- Soslar (10 kg kova)
  sauce({
    slug: "antep-fistikli-waffle-sosu-10-kg",
    name: "ByMaster Antep Fıstıklı Waffle Sosu",
    sku: "BM-WS-ANT-10",
    price: 310000,
    image: { url: "/images/products/antep-fistikli-waffle-sosu-kova.webp", alt: "ByMaster Antep Fıstıklı Waffle Sosu kova ambalajı" },
    categories: ["waffle-soslari"],
    flavors: ["kuruyemis"],
    accent: "#7E9440",
    sortOrder: 10,
    short: "Antep fıstıklı waffle sosu; rengiyle de fark yaratan sunumlar için 10 kg kova.",
  }),
  sauce({
    slug: "lotus-waffle-sosu-10-kg",
    name: "ByMaster Lotus Waffle Sosu",
    sku: "BM-WS-LOT-10",
    price: 390000,
    image: { url: "/images/products/lotus-waffle-sosu-kova.webp", alt: "ByMaster Lotus Waffle Sosu kova ambalajı" },
    categories: ["waffle-soslari"],
    flavors: ["biskuvi-karamel"],
    accent: "#B87B3E",
    sortOrder: 20,
    short: "Bisküvi lezzetini waffle ve dondurma sunumlarına taşıyan Lotus sosu; 10 kg kova.",
  }),
  sauce({
    slug: "sutlu-waffle-sosu-10-kg",
    name: "ByMaster Sütlü Waffle Sosu",
    sku: "BM-WS-SUT-10",
    price: 200000,
    image: { url: "/images/products/sutlu-waffle-sosu-kova.webp", alt: "ByMaster Sütlü Waffle Sosu kova ambalajı" },
    categories: ["waffle-soslari", "cikolata-soslari"],
    flavors: ["cikolata"],
    accent: "#6B3A26",
    sortOrder: 30,
    short: "Geniş kitlelere hitap eden klasik sütlü waffle sosu; 10 kg kova.",
  }),
  sauce({
    slug: "frambuazli-waffle-sosu-10-kg",
    name: "ByMaster Frambuazlı Waffle Sosu",
    sku: "BM-WS-FRM-10",
    price: 195000,
    image: { url: "/images/products/frambuazli-waffle-sosu-kova.webp", alt: "ByMaster Frambuazlı Waffle Sosu kova ambalajı" },
    categories: ["waffle-soslari", "meyveli-soslar"],
    flavors: ["meyve"],
    accent: "#B4314A",
    sortOrder: 40,
    short: "Çikolatalı sunumlara ferah bir karşılık sunan frambuazlı sos; 10 kg kova.",
  }),
  sauce({
    slug: "beyaz-waffle-sosu-10-kg",
    name: "ByMaster Beyaz Waffle Sosu",
    subtitle: "Fındık aromalı beyaz sos · 10 kg kova",
    sku: "BM-WS-BYZ-10",
    price: 200000,
    image: { url: "/images/products/beyaz-waffle-sosu-kova.webp", alt: "ByMaster Beyaz Waffle Sosu kova ambalajı" },
    categories: ["waffle-soslari"],
    flavors: ["kuruyemis"],
    accent: "#DCCBAA",
    sortOrder: 50,
    short: "Ambalajında “fındık aromalı beyaz sos” olarak tanımlanan beyaz waffle sosu; 10 kg kova.",
    extra: "Ürün etiketinde “fındık aromalı beyaz sos” olarak tanımlanır.",
  }),
  sauce({
    slug: "bitter-waffle-sosu-10-kg",
    name: "ByMaster Bitter Waffle Sosu",
    sku: "BM-WS-BIT-10",
    price: 210000,
    image: { url: "/images/placeholders/bitter-waffle-sosu-kova.webp", alt: "Bitter waffle sosu kovası — temsili illüstrasyon", isPlaceholder: true },
    categories: ["waffle-soslari", "cikolata-soslari"],
    flavors: ["cikolata"],
    accent: "#2E1A14",
    sortOrder: 60,
    short: "Daha koyu ve yoğun çikolata karakteri arayan menüler için bitter waffle sosu; 10 kg kova.",
  }),
  sauce({
    slug: "premium-cikolata-bazi-10-kg",
    name: "ByMaster Premium Çikolata Bazı",
    sku: "BM-CB-PRM-10",
    price: 280000,
    image: { url: "/images/placeholders/premium-cikolata-bazi-kova.webp", alt: "Premium çikolata bazı kovası — temsili illüstrasyon", isPlaceholder: true },
    primary: "cikolata-soslari",
    categories: ["cikolata-soslari"],
    flavors: ["cikolata"],
    accent: "#3B2016",
    sortOrder: 70,
    short: "Çikolata ağırlıklı sunumlar kurgulayan işletmeler için Premium Çikolata Bazı; 10 kg kova.",
    usages: ["waffle", "krep", "dondurma", "churros", "pasta-kek"],
  }),

  // ------------------------------------------------------------- Waffle Mix
  {
    slug: "waffle-mix-1-kg",
    name: "ByMaster Waffle Mix",
    subtitle: "Bubble waffle karışımı · 1 kg paket",
    brand: "ByMaster",
    primaryCategory: "waffle-mix-ve-karisimlar",
    shortDescription: "Ambalajında “Bubble Waffle Mix” ibaresi bulunan waffle karışımı; 1 kg paket, koli içi 12 paket.",
    description:
      "ByMaster Waffle Mix, ambalajında “Bubble Waffle Mix” ibaresiyle 1 kg'lık paketlerde sunulur. Toplu alımlarda koli içinde 12 paket bulunur.\n\nHazırlama oranları ve pişirme önerileri için ambalaj üzerindeki talimatları uygulayın.",
    usageAreasText: "Bubble waffle ve waffle hazırlığı",
    usageTips:
      "Karışımı ambalaj üzerindeki oranlara göre hazırlayın. Waffle makinesini tam ısıya ulaştıktan sonra kullanın ve kalıbı taşırmadan doldurun.",
    accentColor: "#C8A27A",
    isFeatured: true,
    sortOrder: 80,
    flavors: [],
    usages: ["waffle"],
    images: [{ url: "/images/products/waffle-mix-koli.webp", alt: "ByMaster Bubble Waffle Mix 1000 g paket ve 12 adetlik koli" }],
    variant: { sku: "BM-WM-1", name: "1 kg Paket", packageType: "PAKET", netWeightGrams: 1000, unitsPerCase: 12, priceKurus: 25000, vatRate: 1 },
  },

  // ------------------------------------------------------------- Pirinç patlakları (1 kg)
  bead({
    colorName: "Karışık", slugPart: "metalik-karisik", skuPart: "MET-KARISIK", accent: "#C99A3E", flavor: "renkli-dekoratif", sortOrder: 100, metallic: true, featured: true,
    images: [{ url: "/images/products/pirinc-patlagi-metalik-karisik.webp", alt: "Karışık renkli metalik pirinç patlağı paketi" }],
  }),
  bead({
    colorName: "Kırmızı", slugPart: "metalik-kirmizi", skuPart: "MET-KIRMIZI", accent: "#A8262C", flavor: "renkli-dekoratif", sortOrder: 101, metallic: true,
    images: [
      { url: "/images/products/pirinc-patlagi-metalik-kirmizi.webp", alt: "Metalik kırmızı pirinç patlağı paketi" },
      { url: "/images/products/pirinc-patlagi-kirmizi-mor.webp", alt: "Metalik kırmızı ve mor pirinç patlağı paketleri", kind: "DETAIL" },
    ],
  }),
  bead({
    colorName: "Mor", slugPart: "metalik-mor", skuPart: "MET-MOR", accent: "#5F4A8B", flavor: "renkli-dekoratif", sortOrder: 102, metallic: true,
    images: [
      { url: "/images/products/pirinc-patlagi-metalik-mor.webp", alt: "Metalik mor pirinç patlağı paketi" },
      { url: "/images/products/pirinc-patlagi-kirmizi-mor.webp", alt: "Metalik kırmızı ve mor pirinç patlağı paketleri", kind: "DETAIL" },
    ],
  }),
  bead({
    colorName: "Sarı", slugPart: "metalik-sari", skuPart: "MET-SARI", accent: "#D8BC2E", flavor: "renkli-dekoratif", sortOrder: 103, metallic: true,
    images: [{ url: "/images/products/pirinc-patlagi-metalik-sari.webp", alt: "Metalik sarı pirinç patlağı paketi" }],
  }),
  bead({
    colorName: "Yeşil", slugPart: "metalik-yesil", skuPart: "MET-YESIL", accent: "#5E9E36", flavor: "renkli-dekoratif", sortOrder: 104, metallic: true,
    images: [{ url: "/images/products/pirinc-patlagi-metalik-yesil.webp", alt: "Metalik yeşil pirinç patlağı paketi" }],
  }),
  bead({
    colorName: "Sedef Beyaz", slugPart: "metalik-sedef-beyaz", skuPart: "MET-SEDEF", accent: "#E9E0D0", flavor: "renkli-dekoratif", sortOrder: 105, metallic: true,
    images: [{ url: "/images/products/pirinc-patlagi-metalik-sedef-beyaz.webp", alt: "Metalik sedef beyaz pirinç patlağı paketi" }],
  }),
  bead({ colorName: "Gümüş", slugPart: "metalik-gumus", skuPart: "MET-GUMUS", accent: "#AEB3BA", flavor: "renkli-dekoratif", sortOrder: 106, metallic: true }),
  bead({ colorName: "Altın", slugPart: "metalik-altin", skuPart: "MET-ALTIN", accent: "#CFA23A", flavor: "renkli-dekoratif", sortOrder: 107, metallic: true }),
  bead({ colorName: "Bronz", slugPart: "metalik-bronz", skuPart: "MET-BRONZ", accent: "#A06A3C", flavor: "renkli-dekoratif", sortOrder: 108, metallic: true }),
  bead({ colorName: "Mavi", slugPart: "metalik-mavi", skuPart: "MET-MAVI", accent: "#3A67A8", flavor: "renkli-dekoratif", sortOrder: 109, metallic: true }),
  bead({ colorName: "Turuncu", slugPart: "metalik-turuncu", skuPart: "MET-TURUNCU", accent: "#DF7A2C", flavor: "renkli-dekoratif", sortOrder: 110, metallic: true }),
  bead({ colorName: "Lila", slugPart: "metalik-lila", skuPart: "MET-LILA", accent: "#AD94C8", flavor: "renkli-dekoratif", sortOrder: 111, metallic: true }),
  bead({ colorName: "Bitter", slugPart: "bitter", skuPart: "BITTER", accent: "#3A2219", flavor: "cikolata", sortOrder: 112 }),
  bead({ colorName: "Sütlü", slugPart: "sutlu", skuPart: "SUTLU", accent: "#7A4A32", flavor: "cikolata", sortOrder: 113 }),
  bead({ colorName: "Fildişi", slugPart: "fildisi", skuPart: "FILDISI", accent: "#EFE5CF", flavor: "renkli-dekoratif", sortOrder: 114 }),
  bead({ colorName: "Frambuaz", slugPart: "frambuaz", skuPart: "FRAMBUAZ", accent: "#BF3550", flavor: "meyve", sortOrder: 115 }),

  // ------------------------------------------------------------- Krep kırıkları (2,5 kg)
  crepe({ label: "Oreo", slugPart: "oreo", skuPart: "OREO", price: 94000, accent: "#2B2321", flavor: "biskuvi-karamel", sortOrder: 200, featured: true }),
  crepe({ label: "Çilek", slugPart: "cilek", skuPart: "CILEK", price: 94000, accent: "#C8475A", flavor: "meyve", sortOrder: 201, featured: true }),
  crepe({ label: "Karamel", slugPart: "karamel", skuPart: "KARAMEL", price: 94000, accent: "#B86A2C", flavor: "biskuvi-karamel", sortOrder: 202 }),
  crepe({ label: "Antep Fıstık", slugPart: "antep-fistik", skuPart: "ANTEP", price: 94000, accent: "#8DAA3F", flavor: "kuruyemis", sortOrder: 203 }),
  crepe({ label: "Sade", slugPart: "sade", skuPart: "SADE", price: 86000, accent: "#D6A35C", flavor: "sade", sortOrder: 204 }),

  // ------------------------------------------------------------- Şekerlemeler (1 kg)
  {
    slug: "minibon-1-kg",
    name: "Minibon",
    subtitle: "Renkli şekerleme · 1 kg paket",
    brand: null,
    primaryCategory: "sekerlemeler-ve-toppingler",
    shortDescription: "Renkli Minibon şekerlemeleri; waffle, dondurma ve pasta süslemesi için 1 kg paket.",
    description: "Renkli Minibon şekerlemeleri, waffle, dondurma, pasta ve kek sunumlarına neşeli bir görünüm kazandırmak için 1 kg paket hâlinde sunulur.",
    usageAreasText: "Waffle, dondurma, pasta ve kek süslemeleri",
    usageTips: TOPPING_TIPS,
    accentColor: "#E2A63B",
    isFeatured: false,
    sortOrder: 300,
    flavors: ["renkli-dekoratif"],
    usages: TOPPING_USAGES,
    images: [{ url: "/images/products/minibon.webp", alt: "Minibon renkli şekerleme paketi ve yakın çekim" }],
    variant: { sku: "SK-MINIBON-1", name: "1 kg Paket", packageType: "PAKET", netWeightGrams: 1000, priceKurus: 19000, vatRate: 1 },
  },
  {
    slug: "cakiltasi-sekerleme-1-kg",
    name: "Çakıltaşı Şekerleme",
    subtitle: "1 kg paket",
    brand: null,
    primaryCategory: "sekerlemeler-ve-toppingler",
    shortDescription: "Renkli çakıltaşı şekerlemeleri; tatlı sunumlarına dekoratif dokunuş, 1 kg paket.",
    description: "Renkli çakıltaşı şekerlemeleri, tatlı sunumlarına dekoratif bir dokunuş katmak için 1 kg paket hâlinde sunulur.",
    usageAreasText: "Waffle, dondurma, pasta ve kek süslemeleri",
    usageTips: TOPPING_TIPS,
    accentColor: "#C9563C",
    isFeatured: false,
    sortOrder: 301,
    flavors: ["renkli-dekoratif"],
    usages: TOPPING_USAGES,
    images: [{ url: "/images/products/cakiltasi.webp", alt: "Çakıltaşı renkli şekerleme paketi" }],
    variant: { sku: "SK-CAKIL-1", name: "1 kg Paket", packageType: "PAKET", netWeightGrams: 1000, priceKurus: 19000, vatRate: 1 },
  },

  // ------------------------------------------------------------- Evde tatlı kitleri
  {
    slug: "churros-box",
    name: "ByMaster Churros Box",
    subtitle: "Evde churros kiti",
    brand: "ByMaster",
    kind: "KIT",
    primaryCategory: "evde-tatli-kitleri",
    shortDescription: "Churros miks, üç premium sos, süslemeler ve sıkma torbası tek kutuda. Kargo ücretsiz.",
    description:
      "Senin mutfağın, senin churros'un: Churros Box; churros miksini, üç farklı premium sosu, süslemeleri ve sıkma torbasını tek kutuda bir araya getirir. Arkadaşlarla paylaşılacak bir tabak churros için ihtiyaç duyacağınız temel malzemeler kutunun içinde.",
    kitContents:
      "Churros Miks 500 g\n3 adet premium sos (Sütlü, Bitter, Beyaz)\nTarçınlı şeker\nOreolu krep kırığı\nKaramelli krep kırığı\nKarışık pirinç patlağı\n1 sıkma torbası ve uç",
    usageAreasText: "Evde churros ve paylaşmalık tatlı sunumları",
    accentColor: "#C9A57E",
    isFeatured: true,
    freeShipping: true,
    sortOrder: 400,
    flavors: [],
    usages: ["churros"],
    images: [
      { url: "/images/products/churros-box.webp", alt: "ByMaster Churros Box: açık kutu ve kutu içeriği etiketi" },
      { url: "/images/products/churros-box-ic.webp", alt: "Churros Box bölmeleri: churros miks, soslar, süslemeler ve sıkma torbası", kind: "DETAIL" },
    ],
    variant: { sku: "BM-KIT-CHURROS", name: "Kutu", packageType: "KUTU", priceKurus: 94900, vatRate: 1 },
    seoDescription: "ByMaster Churros Box: churros miks 500 g, üç premium sos, süslemeler ve sıkma torbası tek kutuda. Kargo ücretsiz.",
  },
  {
    slug: "pankek-box",
    name: "ByMaster Pankek Box",
    subtitle: "Evde pankek kiti",
    brand: "ByMaster",
    kind: "KIT",
    primaryCategory: "evde-tatli-kitleri",
    shortDescription: "Pankek miks, üç premium sos, süslemeler ve silikon pankek kalıbı tek kutuda. Kargo ücretsiz.",
    description:
      "Senin mutfağın, senin pankek'in: Pankek Box; pankek miksini, üç farklı premium sosu, süslemeleri ve silikon pankek kalıbını tek kutuda bir araya getirir. Hafta sonu kahvaltıları ve aile sofraları için pratik bir başlangıç.",
    kitContents:
      "Pankek Miks 500 g\n3 adet premium sos (Sütlü, Beyaz, Frambuaz)\nLotus Biscoff süsleme\nOreolu krep kırığı\nKarışık pirinç patlağı\nSilikon pankek kalıbı",
    usageAreasText: "Evde pankek ve kahvaltı tatlıları",
    accentColor: "#D9B47F",
    isFeatured: true,
    freeShipping: true,
    sortOrder: 401,
    flavors: [],
    usages: ["pankek"],
    images: [
      { url: "/images/products/pankek-box.webp", alt: "ByMaster Pankek Box: açık kutu ve kutu içeriği etiketi" },
      { url: "/images/products/pankek-box-ic.webp", alt: "Pankek Box bölmeleri: pankek miks, soslar, süslemeler ve silikon kalıp", kind: "DETAIL" },
    ],
    variant: { sku: "BM-KIT-PANKEK", name: "Kutu", packageType: "KUTU", priceKurus: 94900, vatRate: 1 },
    seoDescription: "ByMaster Pankek Box: pankek miks 500 g, üç premium sos, süslemeler ve silikon kalıp tek kutuda. Kargo ücretsiz.",
  },
  {
    slug: "waffle-box",
    name: "ByMaster Waffle Box",
    subtitle: "Evde waffle keyfi",
    brand: "ByMaster",
    kind: "KIT",
    saleStatus: "COMING_SOON",
    primaryCategory: "evde-tatli-kitleri",
    shortDescription: "Meyveni al, gerisini biz hazırladık: waffle miks, üç sos, waffle kaseleri ve topping şekerlemeler.",
    description:
      "“Meyveni al, gerisini biz hazırladık!” Waffle Box; waffle miksini, üç farklı sosu, waffle kaselerini ve topping şekerlemelerini tek kutuda bir araya getirir. Taze meyveler kutuya dahil değildir; muz, çilek, kivi veya yaban mersini gibi sevdiğiniz meyvelerle waffle'ınızı kendi tarzınızda hazırlayabilirsiniz.\n\nWaffle Box henüz satışa açılmadı. Satışa açıldığında haberdar olmak için e-posta adresinizi bırakabilirsiniz.",
    kitContents: "Waffle Miks 500 g\n3 × 300 g sos (Sütlü, Beyaz, Çilekli)\n5 adet waffle kasesi\nTopping şekerlemeler\nVideolu tarife erişim için QR kod",
    kitPreparation: "Waffle miksini hazırla.\nWaffle'ını pişir.\nMeyveni doğra.\nSosunu seç.\nDilediğin gibi süsle.",
    usageAreasText: "Evde waffle ve meyveli tatlı sunumları",
    accentColor: "#C7A06F",
    isFeatured: false,
    freeShipping: true,
    sortOrder: 402,
    flavors: [],
    usages: ["waffle"],
    images: [
      { url: "/images/products/waffle-box.webp", alt: "ByMaster Waffle Box kutusu" },
      { url: "/images/products/waffle-box-ic.webp", alt: "Waffle Box içeriği: waffle miks, üç sos, waffle kaseleri ve topping şekerlemeler", kind: "DETAIL" },
      { url: "/images/products/waffle-box-yan.webp", alt: "Waffle Box yan yüzü: Sen meyveni seç", kind: "DETAIL" },
      { url: "/images/products/waffle-box-soslar.webp", alt: "Waffle Box sosları: sütlü, beyaz ve çilekli", kind: "DETAIL" },
    ],
    variant: { sku: "BM-KIT-WAFFLE", name: "Kutu", packageType: "KUTU", priceKurus: 0, vatRate: 1 },
  },

  // ------------------------------------------------------------- Taslak (fiyatı doğrulanmamış)
  {
    slug: "sutlu-cikolata-sos-300-g",
    name: "ByMaster Sütlü Çikolata Sos",
    subtitle: "300 g şişe",
    brand: "ByMaster",
    status: "DRAFT",
    primaryCategory: "cikolata-soslari",
    shortDescription: "Sütlü çikolata sos; 300 g sıkılabilir şişe.",
    description: "ByMaster Sütlü Çikolata Sos, 300 g'lık sıkılabilir şişe ambalajda sunulur.",
    accentColor: "#6B3A26",
    isFeatured: false,
    sortOrder: 75,
    flavors: ["cikolata"],
    usages: SAUCE_USAGES,
    images: [{ url: "/images/products/sutlu-cikolata-sos-300g.webp", alt: "ByMaster Sütlü Çikolata Sos 300 g şişe" }],
    variant: { sku: "BM-SS-SUT-300", name: "300 g Şişe", packageType: "SISE", netWeightGrams: 300, priceKurus: 0, vatRate: 1 },
  },
];

/** Yönetici tarafından değiştirilebilen "Birlikte iyi gider" eşleşmeleri (marka kitlerindeki kombinasyonlardan) */
export const pairings: Record<string, string[]> = {
  "sutlu-waffle-sosu-10-kg": ["krep-kirigi-oreo-2-5-kg", "pirinc-patlagi-metalik-karisik-1-kg", "krep-kirigi-karamel-2-5-kg", "minibon-1-kg"],
  "bitter-waffle-sosu-10-kg": ["krep-kirigi-oreo-2-5-kg", "krep-kirigi-karamel-2-5-kg", "pirinc-patlagi-metalik-karisik-1-kg", "cakiltasi-sekerleme-1-kg"],
  "beyaz-waffle-sosu-10-kg": ["krep-kirigi-oreo-2-5-kg", "krep-kirigi-cilek-2-5-kg", "pirinc-patlagi-metalik-karisik-1-kg", "minibon-1-kg"],
  "antep-fistikli-waffle-sosu-10-kg": ["krep-kirigi-antep-fistik-2-5-kg", "krep-kirigi-sade-2-5-kg", "pirinc-patlagi-metalik-yesil-1-kg", "pirinc-patlagi-metalik-sedef-beyaz-1-kg"],
  "frambuazli-waffle-sosu-10-kg": ["krep-kirigi-cilek-2-5-kg", "krep-kirigi-sade-2-5-kg", "pirinc-patlagi-metalik-kirmizi-1-kg", "minibon-1-kg"],
  "lotus-waffle-sosu-10-kg": ["krep-kirigi-karamel-2-5-kg", "krep-kirigi-sade-2-5-kg", "krep-kirigi-oreo-2-5-kg", "pirinc-patlagi-metalik-karisik-1-kg"],
  "premium-cikolata-bazi-10-kg": ["krep-kirigi-oreo-2-5-kg", "cakiltasi-sekerleme-1-kg", "minibon-1-kg", "pirinc-patlagi-metalik-karisik-1-kg"],
};
