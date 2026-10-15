import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminHeader, Badge, Panel, TableWrap, Td, Th } from "@/components/admin/ui";
import { Alert } from "@/components/ui/Alert";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getSettings, LEGAL_PAGE_SLUGS, missingSellerFields } from "@/lib/settings";
import { formatDateTime } from "@/lib/text";

export const metadata = { title: "Sayfalar ve SSS" };

// getCheckoutReadiness ile aynı liste: bu metinler yayında değilse sipariş alınmaz
const REQUIRED_FOR_CHECKOUT: string[] = [LEGAL_PAGE_SLUGS.preInformation, LEGAL_PAGE_SLUGS.distanceSales];

export default async function AdminPagesPage() {
  await requireAdmin();
  const [pages, faqCount, settings] = await Promise.all([
    db.page.findMany({ orderBy: [{ kind: "asc" }, { title: "asc" }], select: { id: true, slug: true, title: true, kind: true, status: true, updatedAt: true } }),
    db.faqItem.count(),
    getSettings(),
  ]);
  const missing = missingSellerFields(settings);
  const unpublishedRequired = REQUIRED_FOR_CHECKOUT.filter((slug) => !pages.some((p) => p.slug === slug && p.status === "PUBLISHED"));

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Sayfalar ve SSS"
        description="Bilgi sayfaları ve yasal metinler. Yasal metinler şablondur: satıcı bilgileri Site ayarlarından otomatik doldurulur, sipariş bilgileri ödeme adımında eklenir."
        actions={
          <>
            <Link href="/yonetim/sayfalar/sss" className="btn btn-sm btn-outline">
              Sık sorulan sorular ({faqCount})
            </Link>
            <Link href="/yonetim/sayfalar/yeni" className="btn btn-sm btn-primary">
              <Plus className="size-4" aria-hidden="true" /> Yeni sayfa
            </Link>
          </>
        }
      />
      {unpublishedRequired.length > 0 || missing.length > 0 ? (
        <Alert tone="warning" title="Ödeme adımı için eksikler">
          {unpublishedRequired.length > 0 ? (
            <p>Yayında olmayan zorunlu metinler: {unpublishedRequired.map((slug) => pages.find((p) => p.slug === slug)?.title ?? slug).join(", ")}. Bu metinler yayınlanmadan sipariş alınmaz.</p>
          ) : null}
          {missing.length > 0 ? (
            <p>
              Site ayarlarında eksik satıcı bilgileri: {missing.join(", ")}. <Link href="/yonetim/ayarlar">Ayarları tamamlayın</Link>.
            </p>
          ) : null}
        </Alert>
      ) : null}
      <TableWrap>
        <thead>
          <tr>
            <Th>Sayfa</Th>
            <Th>Tür</Th>
            <Th>Durum</Th>
            <Th>Güncelleme</Th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.id} className="hover:bg-cream-100/60">
              <Td>
                <Link href={`/yonetim/sayfalar/${page.id}`} className="font-semibold hover:underline">
                  {page.title}
                </Link>
                <span className="block text-xs text-cocoa-500">{page.slug === "hakkimizda" ? "/hakkimizda" : `/sayfa/${page.slug}`}</span>
              </Td>
              <Td>
                {page.kind === "LEGAL" ? "Yasal metin" : "Bilgi"}
                {REQUIRED_FOR_CHECKOUT.includes(page.slug) ? <span className="block text-xs text-bordeaux-600">Ödeme için zorunlu</span> : null}
              </Td>
              <Td>{page.status === "PUBLISHED" ? <Badge tone="success">Yayında</Badge> : <Badge tone="warning">Taslak</Badge>}</Td>
              <Td className="text-xs text-cocoa-500">{formatDateTime(page.updatedAt)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <Panel title="Kullanılabilir şablon alanları">
        <p className="text-sm text-cocoa-600">
          Satıcı: {"{{SATICI_UNVAN}} {{SATICI_ADRES}} {{SATICI_TELEFON}} {{SATICI_EPOSTA}} {{SATICI_MERSIS}} {{SATICI_VERGI_DAIRESI}} {{SATICI_VERGI_NO}} {{SATICI_KEP}} {{MAGAZA_ADI}} {{SITE_ADRESI}}"}
        </p>
        <p className="mt-2 text-sm text-cocoa-600">Kargo: {"{{KARGO_UCRETI}} {{UCRETSIZ_KARGO_ESIGI}} {{KARGO_FIRMASI}} {{GONDERIM_SURESI}}"}</p>
        <p className="mt-2 text-sm text-cocoa-600">
          Sipariş (yalnızca ödeme adımında dolar): {"{{ALICI_AD}} {{ALICI_EPOSTA}} {{ALICI_TELEFON}} {{TESLIMAT_ADRESI}} {{FATURA_BILGISI}} {{ODEME_YONTEMI}} {{URUN_TABLOSU}} {{ARA_TOPLAM}} {{INDIRIM}} {{KARGO}} {{TOPLAM}} {{TARIH}} {{SIPARIS_NO}}"}
        </p>
      </Panel>
    </div>
  );
}
