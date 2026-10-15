import { deleteCouponAction, saveCouponAction } from "@/app/actions/admin/marketing";
import { ACheckbox, AdminForm, AField, ASelect, ConfirmButton } from "@/components/admin/AdminForm";
import { AdminHeader, Badge, Panel } from "@/components/admin/ui";
import { toLocalDateTimeInput } from "@/lib/admin-form";
import { requireAdmin } from "@/lib/auth/guards";
import { COUPON_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatTRY, kurusToInput } from "@/lib/money";
import { formatDateTime } from "@/lib/text";

export const metadata = { title: "Kuponlar" };

type Coupon = Awaited<ReturnType<typeof db.coupon.findMany>>[number];

function CouponFields({ coupon }: { coupon?: Coupon }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {coupon ? <input type="hidden" name="id" value={coupon.id} /> : null}
      <AField name="code" label="Kod" defaultValue={coupon?.code} placeholder="ör. HOSGELDIN10" />
      <ASelect name="type" label="Tür" defaultValue={coupon?.type ?? "PERCENT"} options={Object.entries(COUPON_TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
      <AField
        name="value"
        label="Değer (% veya ₺)"
        defaultValue={coupon ? (coupon.type === "FIXED" ? kurusToInput(coupon.value) : coupon.type === "PERCENT" ? String(coupon.value) : "") : ""}
        hint="Ücretsiz kargo kuponunda boş bırakın."
      />
      <AField name="description" label="Açıklama (iç kullanım)" defaultValue={coupon?.description ?? ""} className="md:col-span-3" />
      <AField name="minSubtotal" label="En az sepet tutarı (₺)" defaultValue={kurusToInput(coupon?.minSubtotalKurus)} />
      <AField name="maxDiscount" label="En fazla indirim (₺, yüzdede)" defaultValue={kurusToInput(coupon?.maxDiscountKurus)} />
      <AField name="usageLimit" label="Toplam kullanım limiti" defaultValue={coupon?.usageLimit ?? ""} inputMode="numeric" />
      <AField name="usageLimitPerEmail" label="Kişi başı limit (e-posta)" defaultValue={coupon?.usageLimitPerEmail ?? ""} inputMode="numeric" />
      <AField name="startsAt" label="Başlangıç" type="datetime-local" defaultValue={toLocalDateTimeInput(coupon?.startsAt)} />
      <AField name="endsAt" label="Bitiş" type="datetime-local" defaultValue={toLocalDateTimeInput(coupon?.endsAt)} />
      <ACheckbox name="isActive" label="Aktif" defaultChecked={coupon?.isActive ?? true} className="md:col-span-3" />
    </div>
  );
}

export default async function AdminCouponsPage() {
  await requireAdmin();
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();
  return (
    <div className="space-y-6">
      <AdminHeader title="Kuponlar" description="İndirimler sepette sunucu tarafında doğrulanır; kullanım limiti siparişte atomik olarak kontrol edilir. Gerçek olmayan kampanya kullanmayın." />
      {coupons.length === 0 ? <p className="text-sm text-cocoa-500">Henüz kupon yok.</p> : null}
      {coupons.map((coupon) => {
        const expired = coupon.endsAt && coupon.endsAt < now;
        return (
          <details key={coupon.id} className="group rounded-2xl border border-cocoa-800/10 bg-white">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <span className="font-mono text-lg font-bold">{coupon.code}</span>
              <Badge tone="dark">
                {coupon.type === "PERCENT" ? `%${coupon.value}` : coupon.type === "FIXED" ? formatTRY(coupon.value) : "Ücretsiz kargo"}
              </Badge>
              {coupon.isActive && !expired ? <Badge tone="success">Aktif</Badge> : <Badge>{expired ? "Süresi doldu" : "Pasif"}</Badge>}
              <span className="text-xs text-cocoa-500">
                {coupon.usedCount} kullanım{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                {coupon.endsAt ? ` · bitiş ${formatDateTime(coupon.endsAt)}` : ""}
              </span>
              <span className="ml-auto text-xs font-bold text-bordeaux-600 group-open:hidden">Düzenle</span>
            </summary>
            <div className="border-t border-cocoa-800/10 p-5">
              <AdminForm action={saveCouponAction}>
                <CouponFields coupon={coupon} />
              </AdminForm>
              <div className="mt-4 border-t border-cocoa-800/10 pt-4">
                <ConfirmButton
                  action={deleteCouponAction}
                  fields={{ id: coupon.id }}
                  label={coupon.usedCount ? "Pasife al" : "Sil"}
                  confirmText={coupon.usedCount ? "Kullanılmış kupon silinmez, pasife alınır. Devam edilsin mi?" : "Kupon silinecek. Emin misiniz?"}
                />
              </div>
            </div>
          </details>
        );
      })}
      <Panel title="Yeni kupon">
        <AdminForm action={saveCouponAction} submitLabel="Kupon oluştur" resetOnSuccess>
          <CouponFields />
        </AdminForm>
      </Panel>
    </div>
  );
}
