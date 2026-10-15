import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth/guards";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Giriş yap", robots: { index: false, follow: true } };

type Props = { searchParams: Promise<{ sonra?: string; sifre?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { sonra, sifre } = await searchParams;
  const next = sonra ? safeRedirectPath(sonra, "/hesabim") : undefined;
  const user = await getCurrentUser();
  if (user) redirect(next ?? (user.role === "ADMIN" ? "/yonetim" : "/hesabim"));
  return (
    <AuthShell title="Giriş yap" description="Hesabınıza giriş yaparak siparişlerinizi takip edin ve daha hızlı alışveriş yapın.">
      <LoginForm next={next} notice={sifre === "yenilendi" ? "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz." : null} />
      <div className="mt-8 space-y-3 border-t border-cocoa-800/10 pt-6 text-sm text-cocoa-600">
        <p>
          Hesabınız yok mu?{" "}
          <Link href={`/kayit${next ? `?sonra=${encodeURIComponent(next)}` : ""}`} className="font-bold text-bordeaux-600 hover:underline">
            Hemen oluşturun
          </Link>
        </p>
        {next === "/odeme" ? (
          <p>
            Üye olmadan devam etmek için{" "}
            <Link href="/odeme" className="font-bold text-bordeaux-600 hover:underline">
              misafir olarak ödeme adımına geçin
            </Link>
            .
          </p>
        ) : null}
      </div>
    </AuthShell>
  );
}
