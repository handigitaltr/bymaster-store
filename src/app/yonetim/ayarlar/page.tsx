import {
  saveIntegrationSettingsAction,
  savePaymentSettingsAction,
  saveSellerSettingsAction,
  saveShippingSettingsAction,
} from "@/app/actions/admin/settings";
import { ACheckbox, AdminForm, AField, ASelect, ATextArea } from "@/components/admin/AdminForm";
import { BankAccountsField } from "@/components/admin/BankAccountsField";
import { AdminHeader, Badge, Panel } from "@/components/admin/ui";
import { Alert } from "@/components/ui/Alert";
import { requireAdmin } from "@/lib/auth/guards";
import { isEmailConfigured } from "@/lib/email";
import { appUrl, env } from "@/lib/env";
import { kurusToInput } from "@/lib/money";
import { getCardProviderId, PROVIDER_LABELS } from "@/lib/payments/config";
import { getSettings, parseBankAccounts } from "@/lib/settings";
import { formatPhoneForDisplay } from "@/lib/text";

export const metadata = { title: "Site ayarları" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  const provider = getCardProviderId();
  const configuredButIncomplete = env.PAYMENT_PROVIDER !== "none" && !provider;

  return (
    <div className="space-y-6">
      <AdminHeader title="Site ayarları" description="Bu bilgiler sözleşmelerde, alt bilgide, iletişim sayfasında ve e-postalarda kullanılır. Yalnızca doğrulanmış bilgileri girin." />

      <nav aria-label="Ayar bölümleri" className="flex flex-wrap gap-2 text-sm">
        {[
          ["#satici", "Satıcı ve iletişim"],
          ["#kargo", "Kargo"],
          ["#odeme", "Ödeme"],
          ["#eposta", "E-posta"],
          ["#analiz", "Analiz araçları"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="pill bg-white ring-1 ring-cocoa-800/10 hover:bg-cream-100">
            {label}
          </a>
        ))}
      </nav>

      <Panel id="satici" title="Satıcı ve iletişim bilgileri" className="scroll-mt-24">
        <AdminForm action={saveSellerSettingsAction}>
          <div className="grid gap-4 md:grid-cols-2">
            <AField name="storeName" label="Mağaza adı" defaultValue={settings.storeName} />
            <AField name="companyLegalName" label="Şirket unvanı (tam)" defaultValue={settings.companyLegalName ?? ""} hint="Sözleşmelerde satıcı olarak görünür." />
            <ATextArea name="companyAddress" label="Şirket adresi" rows={2} defaultValue={settings.companyAddress ?? ""} className="md:col-span-2" />
            <AField name="companyPhone" label="Telefon" defaultValue={settings.companyPhone ?? ""} />
            <AField name="companyEmail" label="E-posta" type="email" defaultValue={settings.companyEmail ?? ""} />
            <AField name="companyTaxOffice" label="Vergi dairesi" defaultValue={settings.companyTaxOffice ?? ""} />
            <AField name="companyTaxNumber" label="Vergi numarası" inputMode="numeric" defaultValue={settings.companyTaxNumber ?? ""} />
            <AField name="companyMersis" label="MERSİS no" inputMode="numeric" defaultValue={settings.companyMersis ?? ""} />
            <AField name="companyKep" label="KEP adresi" defaultValue={settings.companyKep ?? ""} />
            <AField name="supportHours" label="Çalışma saatleri" defaultValue={settings.supportHours ?? ""} placeholder="ör. Hafta içi 09.00–18.00" />
            <AField name="whatsappPhone" label="WhatsApp hattı" defaultValue={formatPhoneForDisplay(settings.whatsappPhone)} hint="Boş bırakılırsa sitede WhatsApp bağlantısı gösterilmez." />
            <AField name="instagramUrl" label="Instagram adresi" defaultValue={settings.instagramUrl ?? ""} placeholder="https://www.instagram.com/…" hint="Yalnızca gerçek hesap girilirse alt bilgide gösterilir." />
            <AField name="etbisUrl" label="ETBİS doğrulama bağlantısı" defaultValue={settings.etbisUrl ?? ""} placeholder="https://etbis.ticaret.gov.tr/…" />
            <AField
              name="orderNotificationEmail"
              label="Sipariş bildirim e-postası"
              type="email"
              defaultValue={settings.orderNotificationEmail ?? ""}
              hint="Yeni sipariş, B2B teklif, iade ve iletişim formu bildirimleri bu adrese gider."
              className="md:col-span-2"
            />
          </div>
        </AdminForm>
      </Panel>

      <Panel id="kargo" title="Kargo" className="scroll-mt-24">
        <AdminForm action={saveShippingSettingsAction}>
          {settings.shippingFeeKurus === null ? (
            <Alert tone="warning">Kargo ücreti tanımlı değil. Ücretsiz kargolu ürünler dışındaki sepetlerde sipariş alınmaz; sepette “kargo ücreti henüz belirlenmedi” uyarısı gösterilir.</Alert>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            <AField name="shippingFee" label="Kargo ücreti (₺, KDV dahil)" inputMode="decimal" defaultValue={kurusToInput(settings.shippingFeeKurus)} hint="0 = her siparişte ücretsiz. Boş = tanımsız." />
            <AField name="freeShippingThreshold" label="Ücretsiz kargo eşiği (₺)" inputMode="decimal" defaultValue={kurusToInput(settings.freeShippingThresholdKurus)} hint="Boş = eşik yok. İndirim sonrası ara toplama göre." />
            <ASelect
              name="shippingVatRate"
              label="Kargo KDV oranı"
              defaultValue={String(settings.shippingVatRate)}
              options={[
                { value: "20", label: "%20" },
                { value: "10", label: "%10" },
                { value: "1", label: "%1" },
                { value: "0", label: "%0" },
              ]}
            />
            <AField name="shippingCarrierName" label="Kargo firması" defaultValue={settings.shippingCarrierName ?? ""} />
            <AField name="dispatchTimeText" label="Kargoya teslim süresi" defaultValue={settings.dispatchTimeText ?? ""} placeholder="ör. 1–3 iş günü içinde kargoya verilir" className="md:col-span-2" hint="Ürün sayfası ve kargo sayfasında aynen gösterilir; yalnızca uygulayabileceğiniz bir süre yazın." />
          </div>
        </AdminForm>
      </Panel>

      <Panel id="odeme" title="Ödeme" className="scroll-mt-24">
        <div className="mb-6 grid gap-3 rounded-xl bg-cream-100 p-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Kart ödeme sağlayıcısı</p>
            <p className="mt-1 font-semibold">{provider ? PROVIDER_LABELS[provider] : "Bağlı değil"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Mod</p>
            <p className="mt-1">{env.PAYMENT_MODE === "live" ? <Badge tone="success">Canlı</Badge> : <Badge tone="warning">Test — gerçek tahsilat yok</Badge>}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cocoa-500">Bildirim (callback) adresi</p>
            <p className="mt-1 break-all font-mono text-xs">
              {provider === "paytr" ? `${appUrl}/api/odeme/paytr/bildirim` : provider === "iyzico" ? `${appUrl}/api/odeme/iyzico/donus` : "—"}
            </p>
          </div>
          <p className="text-xs text-cocoa-500 md:col-span-3">
            Sağlayıcı ve API anahtarları güvenlik gereği bu panelden değil, sunucu ortam değişkenlerinden (PAYMENT_PROVIDER, PAYMENT_MODE, PAYTR_* / IYZICO_*) yönetilir ve hiçbir zaman tarayıcıya gönderilmez.
          </p>
          {configuredButIncomplete ? (
            <div className="md:col-span-3">
              <Alert tone="error">PAYMENT_PROVIDER “{env.PAYMENT_PROVIDER}” seçili ancak gerekli anahtarlar eksik; kartla ödeme kapalı.</Alert>
            </div>
          ) : null}
        </div>
        <AdminForm action={savePaymentSettingsAction}>
          <ACheckbox name="bankTransferEnabled" label="Havale / EFT ile ödeme" defaultChecked={settings.bankTransferEnabled} hint="Sipariş “ödeme bekleniyor” durumunda oluşur; ödemeyi hesabınızda gördüğünüzde sipariş sayfasından onaylarsınız." />
          <BankAccountsField initial={parseBankAccounts(settings.bankAccountsJson)} />
          <div className="grid gap-4 md:grid-cols-2">
            <AField name="bankTransferHoldHours" label="Havale için stok ayırma süresi (saat)" type="number" min={1} max={168} defaultValue={settings.bankTransferHoldHours} hint="Süre dolunca ödenmeyen sipariş iptal edilir ve stok serbest kalır." />
            <AField name="paymentReservationMinutes" label="Kart ödemesi için ayırma süresi (dakika)" type="number" min={10} max={120} defaultValue={settings.paymentReservationMinutes} />
          </div>
        </AdminForm>
      </Panel>

      <Panel id="eposta" title="E-posta gönderimi" className="scroll-mt-24">
        {isEmailConfigured() ? (
          <Alert tone="success">SMTP yapılandırılmış ({env.SMTP_HOST}). Gönderim sonuçları İşlem kayıtları sayfasında listelenir.</Alert>
        ) : (
          <Alert tone="warning" title="SMTP yapılandırılmadı">
            Sipariş onayı, şifre sıfırlama ve bildirim e-postaları gönderilmez (denemeler “atlandı” olarak kaydedilir). Sunucu ortamına SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD ve SMTP_FROM değişkenlerini ekleyin.
          </Alert>
        )}
      </Panel>

      <Panel id="analiz" title="Analiz ve pazarlama araçları" className="scroll-mt-24">
        <AdminForm action={saveIntegrationSettingsAction}>
          <div className="grid gap-4 md:grid-cols-2">
            <AField name="gaMeasurementId" label="Google Analytics 4 ölçüm kimliği" defaultValue={settings.gaMeasurementId ?? ""} placeholder="G-XXXXXXXXXX" />
            <AField name="metaPixelId" label="Meta Pixel kimliği" inputMode="numeric" defaultValue={settings.metaPixelId ?? ""} />
          </div>
          <p className="text-xs text-cocoa-500">Kimlik girilen araçlar, çerez tercihlerinde ilgili kategori ziyaretçi tarafından onaylanmadan yüklenmez. Boş bırakılan araç için çerez seçeneği de gösterilmez.</p>
        </AdminForm>
      </Panel>
    </div>
  );
}
