import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";
import { Alert } from "@/components/ui/Alert";
import { isEmailConfigured } from "@/lib/email";

export const metadata: Metadata = { title: "Şifremi unuttum", robots: { index: false, follow: true } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Şifremi unuttum" description="Hesabınıza kayıtlı e-posta adresini girin; şifrenizi yenilemeniz için bir bağlantı gönderelim.">
      {isEmailConfigured() ? (
        <ForgotPasswordForm />
      ) : (
        <Alert tone="info" title="E-posta gönderimi şu anda kapalı">
          Şifre sıfırlama bağlantısı e-posta ile gönderildiğinden bu işlem şu an kullanılamıyor. Yardım için{" "}
          <Link href="/iletisim">bize ulaşın</Link>.
        </Alert>
      )}
      <p className="mt-8 text-sm">
        <Link href="/giris" className="font-bold text-bordeaux-600 hover:underline">
          Giriş sayfasına dön
        </Link>
      </p>
    </AuthShell>
  );
}
