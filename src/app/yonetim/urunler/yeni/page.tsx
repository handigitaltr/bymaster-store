import { AdminHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { newVariant, type EditorProduct } from "@/lib/product-editor";
import { getEditorOptions } from "@/lib/admin-product";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata = { title: "Yeni ürün" };

export default async function NewProductPage() {
  await requireAdmin("/yonetim/urunler/yeni");
  const options = await getEditorOptions();
  const empty: EditorProduct = {
    name: "",
    slug: "",
    subtitle: "",
    brand: "ByMaster",
    kind: "SIMPLE",
    status: "DRAFT",
    saleStatus: "AVAILABLE",
    primaryCategoryId: options.categories[0]?.id ?? "",
    categoryIds: [],
    shortDescription: "",
    description: "",
    ingredients: "",
    allergens: "",
    mayContain: "",
    storageConditions: "",
    shelfLife: "",
    usageAreasText: "",
    usageTips: "",
    kitContents: "",
    kitPreparation: "",
    servingInfo: "",
    originInfo: "",
    accentColor: "",
    isFeatured: false,
    freeShipping: false,
    sortOrder: "0",
    seoTitle: "",
    seoDescription: "",
    tagIds: [],
    relatedIds: [],
    images: [],
    variants: [{ ...newVariant(), isDefault: true }],
  };
  return (
    <div>
      <AdminHeader back={{ href: "/yonetim/urunler", label: "Ürünler" }} title="Yeni ürün" description="Ürün önce taslak olarak kaydedilir; bilgileri tamamlayınca yayınlayabilirsiniz." />
      <ProductEditor initial={empty} categories={options.categories} tags={options.tags} products={options.products} publicUrl={null} />
    </div>
  );
}
