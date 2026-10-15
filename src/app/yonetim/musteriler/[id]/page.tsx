import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCustomerAction } from "@/app/actions/admin/crm";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";
import { ACheckbox, AdminForm, ASelect } from "@/components/admin/AdminForm";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { formatDateTime, formatPhoneForDisplay } from "@/lib/text";

export const metadata = { title: "Müşteri" };

export default async function AdminCustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [user, priceLists] = await Promise.all([
    db.user.findUnique({
      where: { id },
      include: { orders: { orderBy: { createdAt: "desc" }, take: 20 }, addresses: true },
    }),
    db.priceList.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!user) notFound();
  return (
    <div className="space-y-6">
      <AdminHeader back={{ href: "/yonetim/musteriler", label: "Müşteriler" }} title={user.name} description={`${user.email} · kayıt ${formatDateTime(user.createdAt)}`} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Siparişler" className="xl:col-span-2">
          {user.orders.length === 0 ? (
            <p className="text-sm text-cocoa-500">Sipariş yok.</p>
          ) : (
            <ul className="divide-y divide-cocoa-800/8 text-sm">
              {user.orders.map((order) => (
                <li key={order.id}>
                  <Link href={`/yonetim/siparisler/${order.id}`} className="flex flex-wrap items-center gap-3 py-2.5 hover:bg-cream-100/60">
                    <span className="font-mono font-bold">{order.orderNumber}</span>
                    <OrderStatusPill status={order.status} />
                    <span className="text-xs text-cocoa-500">{formatDateTime(order.createdAt)}</span>
                    <span className="ml-auto font-bold tabular-nums">{formatTRY(order.totalKurus)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="space-y-6">
          <Panel title="Bilgiler">
            <dl className="space-y-1.5 text-sm">
              <div>Telefon: {user.phone ? formatPhoneForDisplay(user.phone) : "—"}</div>
              {user.companyName ? <div>İşletme: {user.companyName}</div> : null}
              {user.taxNumber ? <div>Vergi: {user.taxOffice} · {user.taxNumber}</div> : null}
              <div>İleti onayı: {user.marketingConsent ? "Var" : "Yok"}</div>
              <div>Son giriş: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—"}</div>
              <div>Kayıtlı adres: {user.addresses.length}</div>
            </dl>
          </Panel>
          <Panel title="Hesap ayarları">
            <AdminForm action={updateCustomerAction}>
              <input type="hidden" name="id" value={user.id} />
              <ASelect
                name="accountType"
                label="Hesap türü"
                defaultValue={user.accountType}
                options={[
                  { value: "INDIVIDUAL", label: "Bireysel" },
                  { value: "BUSINESS", label: "İşletme" },
                ]}
              />
              <ASelect
                name="priceListId"
                label="B2B fiyat listesi"
                defaultValue={user.priceListId ?? ""}
                options={[{ value: "", label: "Liste fiyatları (standart)" }, ...priceLists.map((list) => ({ value: list.id, label: list.name }))]}
                hint="Atanan listedeki fiyatlar, müşteri giriş yaptığında sepette uygulanır."
              />
              <ACheckbox name="isActive" label="Hesap aktif" defaultChecked={user.isActive} hint="Pasif hesap giriş yapamaz; açık oturumları kapatılır." />
            </AdminForm>
          </Panel>
        </div>
      </div>
    </div>
  );
}
