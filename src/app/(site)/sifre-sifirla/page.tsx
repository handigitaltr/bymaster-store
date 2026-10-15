import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = { title: "Yeni şifre belirle", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const token = t && /^[A-Za-z0-9_-]{20,100}$/.test(t) ? t : null;
  return (
    <AuthShell title="Yeni şifre belirle">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert tone="error" title="Bağlantı geçersiz">
          Şifre sıfırlama bağlantısı eksik veya hatalı. <Link href="/sifremi-unuttum">Yeni bağlantı isteyin</Link>.
        </Alert>
      )}
    </AuthShell>
  );
}
