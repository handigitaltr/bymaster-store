import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unsubscribeAction } from "@/app/actions/forms";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const metadata: Metadata = { title: "Bülten aboneliği", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ t?: string; durum?: string }> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const { t, durum } = await searchParams;

  async function confirm(formData: FormData) {
    "use server";
    const token = String(formData.get("token") ?? "");
    const result = await unsubscribeAction(token);
    redirect(`/bulten/ayril?durum=${result.ok ? "tamam" : "gecersiz"}`);
  }

  return (
    <div className="container-page max-w-xl py-24 text-center">
      <h1 className="display-md text-cocoa-900">Bülten aboneliği</h1>
      {durum === "tamam" ? (
        <p className="mt-4 text-cocoa-600">Bülten aboneliğiniz sonlandırıldı. Artık kampanya e-postası almayacaksınız.</p>
      ) : durum === "gecersiz" ? (
        <p className="mt-4 text-cocoa-600">Bu bağlantı geçersiz veya abonelik zaten sonlandırılmış.</p>
      ) : t && /^[A-Za-z0-9_-]{20,80}$/.test(t) ? (
        <form action={confirm} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={t} />
          <p className="text-cocoa-600">ByMaster bülteninden ayrılmak istediğinizi onaylayın.</p>
          <SubmitButton pendingLabel="İşleniyor…">Abonelikten çık</SubmitButton>
        </form>
      ) : (
        <p className="mt-4 text-cocoa-600">Bağlantı eksik görünüyor. E-postadaki “abonelikten çık” bağlantısını kullanın.</p>
      )}
      <Link href="/" className="mt-10 inline-block text-sm font-bold text-bordeaux-600 underline">
        Ana sayfaya dön
      </Link>
    </div>
  );
}
