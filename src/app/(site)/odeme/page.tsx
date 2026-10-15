import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Alert } from "@/components/ui/Alert";
import { getCurrentUser } from "@/lib/auth/guards";
import { findCurrentCart, priceCart } from "@/lib/cart";
import { MARKETING_CONSENT_LABEL } from "@/lib/consents";
import { SORTED_TR_CITIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { isTestPaymentMode } from "@/lib/env";
import { renderTemplate } from "@/lib/legal";
import { expireStaleOrders, getCheckoutReadiness } from "@/lib/orders";
import { PROVIDER_LABELS } from "@/lib/payments/config";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  await expireStaleOrders();
  const user = await getCurrentUser();
  const cart = await findCurrentCart(user);
  const priced = await priceCart(cart, { user });
  if (priced.lines.length === 0) redirect("/sepet");
  if (priced.problems.length > 0) redirect("/sepet");

  const readiness = await getCheckoutReadiness();
  const shippingMissing = priced.totals.shippingStatus === "NOT_CONFIGURED";
  if (!readiness.ready || shippingMissing || !readiness.legal.preInformation || !readiness.legal.distanceSales) {
    return (
      <div className="container-page max-w-2xl py-20">
        <h1 className="display-md text-cocoa-900">Online sipariş yakında aktif</h1>
        <p className="mt-4 text-cocoa-600">
          Sipariş altyapımızın kurulumu tamamlanıyor. Bu süreçte ürünler ve toplu alım hakkında bilgi almak için bize ulaşabilirsiniz.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/iletisim" className="btn btn-primary">
            Bize ulaşın
          </Link>
          <Link href="/profesyonel/teklif" className="btn btn-outline">
            Toplu alım teklifi iste
          </Link>
        </div>
        {user?.role === "ADMIN" ? (
          <Alert tone="warning" title="Yönetici bilgisi: sipariş alımı için eksikler" className="mt-10">
            <ul className="list-disc pl-4">
              {[...readiness.problems, ...(shippingMissing ? ["Kargo ücreti tanımlanmadı (Ayarlar > Kargo)"] : [])].map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
            <Link href="/yonetim" className="mt-2 inline-block">
              Yönetim paneline git
            </Link>
          </Alert>
        ) : null}
      </div>
    );
  }

  const addresses = user
    ? await db.address.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
        select: { id: true, title: true, fullName: true, phone: true, city: true, district: true, addressLine: true, postalCode: true },
      })
    : [];

  return (
    <div className="container-page pb-24 pt-10">
      <p className="eyebrow">Güvenli ödeme</p>
      <h1 className="display-lg mt-2 text-cocoa-900">Siparişi tamamla</h1>
      <div className="mt-10">
        <CheckoutForm
          user={user ? { fullName: user.name, email: user.email, phone: user.phone ?? "" } : null}
          addresses={addresses}
          cities={[...SORTED_TR_CITIES]}
          lines={priced.lines.map((line) => ({
            key: line.variantId,
            name: line.productName,
            variantName: line.variantName,
            quantity: line.quantity,
            unitPriceKurus: line.unitPriceKurus,
            lineTotalKurus: line.lineTotalKurus,
            imageUrl: line.imageUrl,
            imageFit: line.imageFit,
          }))}
          totals={priced.totals}
          couponCode={priced.couponApplied ? priced.couponCode : null}
          payment={{
            card: readiness.cardProvider ? { label: PROVIDER_LABELS[readiness.cardProvider] ?? "ödeme kuruluşunun", testMode: isTestPaymentMode } : null,
            bankTransfer: readiness.bankAccounts.length > 0 ? { holdHours: readiness.settings.bankTransferHoldHours } : null,
          }}
          legal={{
            preInformation: { title: readiness.legal.preInformation.title, content: renderTemplateSellerOnly(readiness.legal.preInformation.content, readiness.seller) },
            distanceSales: { title: readiness.legal.distanceSales.title, content: renderTemplateSellerOnly(readiness.legal.distanceSales.content, readiness.seller) },
          }}
          idempotencyKey={randomUUID()}
          marketingLabel={MARKETING_CONSENT_LABEL}
        />
      </div>
    </div>
  );
}

/** Satıcı bilgilerini doldurur, sipariş değişkenlerini istemcideki canlı önizleme için bırakır */
function renderTemplateSellerOnly(template: string, seller: Record<string, string>) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key: string) => (key in seller ? renderTemplate(match, seller) : match));
}
