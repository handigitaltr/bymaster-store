import { DeleteAccountForm, PasswordForm, ProfileForm } from "@/components/account/AccountForms";
import { requireUser } from "@/lib/auth/guards";

export default async function ProfilePage() {
  const user = await requireUser("/hesabim/profil");
  return (
    <div className="space-y-10">
      <section aria-labelledby="profil">
        <h2 id="profil" className="font-display text-2xl text-cocoa-900">
          Profil bilgileri
        </h2>
        <div className="mt-5">
          <ProfileForm
            user={{
              name: user.name,
              email: user.email,
              phone: user.phone,
              accountType: user.accountType,
              companyName: user.companyName,
              taxOffice: user.taxOffice,
              taxNumber: user.taxNumber,
              marketingConsent: user.marketingConsent,
            }}
          />
        </div>
      </section>
      <section aria-labelledby="sifre" className="border-t border-cocoa-800/10 pt-10">
        <h2 id="sifre" className="font-display text-2xl text-cocoa-900">
          Şifre değiştir
        </h2>
        <p className="mt-1 text-sm text-cocoa-500">Şifreniz değiştiğinde diğer cihazlardaki oturumlarınız kapatılır.</p>
        <div className="mt-5">
          <PasswordForm />
        </div>
      </section>
      {user.role !== "ADMIN" ? (
        <section aria-labelledby="hesap-kapat" className="border-t border-cocoa-800/10 pt-10">
          <h2 id="hesap-kapat" className="font-display text-2xl text-cocoa-900">
            Hesabı kapat
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-cocoa-500">
            KVKK kapsamındaki silme hakkınız için: profil bilgileriniz, adresleriniz ve oturumlarınız silinir. Sipariş kayıtları yasal saklama
            yükümlülükleri nedeniyle korunur.
          </p>
          <div className="mt-5 max-w-md">
            <DeleteAccountForm />
          </div>
        </section>
      ) : null}
    </div>
  );
}
