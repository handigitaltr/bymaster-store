import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { LEGAL_PAGE_SLUGS } from "@/lib/settings";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Hesap oluştur", robots: { index: false, follow: true } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ sonra?: string }> }) {
  const { sonra } = await searchParams;
  const next = sonra ? safeRedirectPath(sonra, "/hesabim") : undefined;
  if (await getCurrentUser()) redirect(next ?? "/hesabim");
  const kvkk = await db.page.findFirst({ where: { slug: LEGAL_PAGE_SLUGS.kvkk, status: "PUBLISHED" }, select: { slug: true } });
  return (
    <AuthShell title="Hesap oluştur" description="Siparişlerinizi tek yerden takip edin, adreslerinizi kaydedin, önceki siparişlerinizi tek tıkla tekrarlayın.">
      <RegisterForm next={next} kvkkHref={kvkk ? `/sayfa/${kvkk.slug}` : null} />
      <p className="mt-8 border-t border-cocoa-800/10 pt-6 text-sm text-cocoa-600">
        Zaten hesabınız var mı?{" "}
        <Link href={`/giris${next ? `?sonra=${encodeURIComponent(next)}` : ""}`} className="font-bold text-bordeaux-600 hover:underline">
          Giriş yapın
        </Link>
      </p>
    </AuthShell>
  );
}
