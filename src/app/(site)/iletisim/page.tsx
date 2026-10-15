import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/brand/SocialIcons";
import { ContactForm } from "@/components/site/ContactForm";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { getSettings, LEGAL_PAGE_SLUGS } from "@/lib/settings";
import { formatPhoneForDisplay } from "@/lib/text";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: "İletişim",
  description: "Sipariş, ürün bilgisi, toptan alım ve iş birlikleri için ByMaster ile iletişime geçin.",
  path: "/iletisim",
});

export default async function ContactPage() {
  const [settings, kvkk] = await Promise.all([
    getSettings(),
    db.page.findFirst({ where: { slug: LEGAL_PAGE_SLUGS.kvkk, status: "PUBLISHED" }, select: { slug: true } }),
  ]);
  const channels = [
    settings.companyPhone
      ? { icon: Phone, label: "Telefon", value: formatPhoneForDisplay(settings.companyPhone), href: `tel:${settings.companyPhone}` }
      : null,
    settings.whatsappPhone
      ? { icon: MessageCircle, label: "WhatsApp", value: formatPhoneForDisplay(settings.whatsappPhone), href: `https://wa.me/${settings.whatsappPhone.replace(/\D/g, "")}` }
      : null,
    settings.companyEmail ? { icon: Mail, label: "E-posta", value: settings.companyEmail, href: `mailto:${settings.companyEmail}` } : null,
    settings.companyAddress ? { icon: MapPin, label: "Adres", value: settings.companyAddress, href: null } : null,
    settings.supportHours ? { icon: Clock, label: "Çalışma saatleri", value: settings.supportHours, href: null } : null,
    settings.instagramUrl ? { icon: InstagramIcon, label: "Instagram", value: "Instagram hesabımız", href: settings.instagramUrl } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="container-page grid gap-14 pb-24 pt-12 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <p className="eyebrow">İletişim</p>
        <h1 className="display-lg mt-3 text-cocoa-900">Size nasıl yardımcı olabiliriz?</h1>
        <p className="mt-4 text-lg text-cocoa-600">
          Sipariş, ürün bilgisi, toplu alım veya iş birlikleri için bize yazın. Toplu alım talepleri için{" "}
          <Link href="/profesyonel/teklif" className="font-bold text-bordeaux-600 underline">
            teklif formunu
          </Link>{" "}
          kullanabilirsiniz.
        </p>
        {channels.length > 0 ? (
          <ul className="mt-10 space-y-5">
            {channels.map((channel) => (
              <li key={channel.label} className="flex gap-4">
                <span className="grid size-11 flex-none place-content-center rounded-full bg-cream-200 text-caramel-700">
                  <channel.icon className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs font-bold uppercase tracking-wider text-cocoa-500">{channel.label}</span>
                  {channel.href ? (
                    <a
                      href={channel.href}
                      className="font-semibold text-cocoa-900 hover:text-bordeaux-600"
                      {...(channel.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {channel.value}
                    </a>
                  ) : (
                    <span className="font-semibold text-cocoa-900">{channel.value}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-10 text-sm text-cocoa-600">
          Sipariş durumunuzu öğrenmek için{" "}
          <Link href="/siparis-takip" className="font-bold text-bordeaux-600 underline">
            sipariş takibi
          </Link>{" "}
          sayfasını da kullanabilirsiniz.
        </p>
      </div>
      <div className="rounded-[1.6rem] border border-cocoa-800/10 bg-white p-6 sm:p-8 lg:col-span-7">
        <ContactForm kvkkHref={kvkk ? `/sayfa/${kvkk.slug}` : null} />
      </div>
    </div>
  );
}
