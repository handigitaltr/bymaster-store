import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProductAction } from "@/app/actions/admin/products";
import { ConfirmButton } from "@/components/admin/AdminForm";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { AdminHeader } from "@/components/admin/ui";
import { Alert } from "@/components/ui/Alert";
import { getEditorOptions, loadEditorProduct } from "@/lib/admin-product";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Ürünü düzenle" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kaydedildi?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { kaydedildi } = await searchParams;
  const [product, options, orderCount, waiting] = await Promise.all([
    loadEditorProduct(id),
    getEditorOptions(),
    db.orderItem.count({ where: { productId: id } }),
    db.stockNotification.count({ where: { variant: { productId: id }, notifiedAt: null } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <AdminHeader
        back={{ href: "/yonetim/urunler", label: "Ürünler" }}
        title={product.name}
        description={`${orderCount} sipariş kaleminde geçiyor${waiting ? ` · ${waiting} kişi “haber ver” listesinde` : ""}`}
        actions={
          <ConfirmButton
            action={deleteProductAction}
            fields={{ id }}
            label={
              <>
                <Trash2 className="size-4" aria-hidden="true" /> {orderCount ? "Arşive al" : "Sil"}
              </>
            }
            confirmText={orderCount ? "Bu ürünün sipariş geçmişi var; silinmeyecek, arşive alınacak. Devam edilsin mi?" : "Ürün kalıcı olarak silinecek. Emin misiniz?"}
          />
        }
      />
      {kaydedildi ? <Alert tone="success" className="mb-6">Ürün oluşturuldu.</Alert> : null}
      <ProductEditor
        initial={product}
        categories={options.categories}
        tags={options.tags}
        products={options.products}
        publicUrl={product.status === "ACTIVE" ? `/urun/${product.slug}` : null}
      />
    </div>
  );
}
