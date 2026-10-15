// Ürün editörünün veri tipleri ve varsayılanları (sunucu ve istemci bileşenlerinde ortak; "use client" içermez)

export type EditorImage = { url: string; alt: string; isPlaceholder: boolean; fit: "contain" | "cover"; kind: "PACKSHOT" | "DETAIL" | "LIFESTYLE" };
export type EditorVariant = {
  id?: string;
  key: string;
  sku: string;
  name: string;
  packageType: string;
  netWeightGrams: string;
  unitsPerCase: string;
  price: string;
  compareAtPrice: string;
  vatRate: string;
  trackStock: boolean;
  initialStock: string;
  stock: number | null;
  lowStockThreshold: string;
  minOrderQty: string;
  maxOrderQty: string;
  servingGrams: string;
  isActive: boolean;
  isDefault: boolean;
};
export type EditorProduct = {
  id?: string;
  name: string;
  slug: string;
  subtitle: string;
  brand: string;
  kind: "SIMPLE" | "KIT";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  saleStatus: "AVAILABLE" | "COMING_SOON";
  primaryCategoryId: string;
  categoryIds: string[];
  shortDescription: string;
  description: string;
  ingredients: string;
  allergens: string;
  mayContain: string;
  storageConditions: string;
  shelfLife: string;
  usageAreasText: string;
  usageTips: string;
  kitContents: string;
  kitPreparation: string;
  servingInfo: string;
  originInfo: string;
  accentColor: string;
  isFeatured: boolean;
  freeShipping: boolean;
  sortOrder: string;
  seoTitle: string;
  seoDescription: string;
  tagIds: string[];
  relatedIds: string[];
  images: EditorImage[];
  variants: EditorVariant[];
};

export function newVariant(): EditorVariant {
  return {
    key: `v-${Math.random().toString(36).slice(2)}`,
    sku: "",
    name: "",
    packageType: "PAKET",
    netWeightGrams: "",
    unitsPerCase: "",
    price: "",
    compareAtPrice: "",
    vatRate: "1",
    trackStock: true,
    initialStock: "0",
    stock: null,
    lowStockThreshold: "5",
    minOrderQty: "1",
    maxOrderQty: "",
    servingGrams: "",
    isActive: true,
    isDefault: false,
  };
}
