import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { JsonLd } from "@/components/ui/JsonLd";
import { db } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { STATIC_SITE } from "@/lib/site-mode";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: "Sıkça Sorulan Sorular",
  description: "Sipariş, kargo, ürün bilgileri ve toplu alım hakkında sıkça sorulan sorular.",
  path: "/sss",
});

export default async function FaqPage() {
  const [items, settings] = await Promise.all([
    db.faqItem.findMany({ where: { isPublished: true }, orderBy: [{ sortOrder: "asc" }] }),
    getSettings(),
  ]);

  // Kargo bilgisi yalnızca yönetim panelinde tanımlıysa, oradaki değerlerle gösterilir
  const dynamicItems: Array<{ group: string; question: string; answer: string }> = [];
  if (settings.shippingFeeKurus !== null) {
    const parts = [
      settings.shippingFeeKurus === 0 ? "Kargo ücretsizdir." : `Standart kargo ücreti ${formatTRY(settings.shippingFeeKurus)} (KDV dahil).`,
      settings.freeShippingThresholdKurus !== null ? `${formatTRY(settings.freeShippingThresholdKurus)} ve üzeri siparişlerde kargo ücretsizdir.` : "",
      "Evde Tatlı Kitleri'nde kargo ücretsizdir.",
    ].filter(Boolean);
    dynamicItems.push({ group: "Kargo ve teslimat", question: "Kargo ücreti ne kadar?", answer: parts.join(" ") });
  }
  if (settings.dispatchTimeText) {
    dynamicItems.push({ group: "Kargo ve teslimat", question: "Siparişim ne zaman kargoya verilir?", answer: settings.dispatchTimeText });
  }

  const all = [...items.map((item) => ({ group: item.group ?? "Genel", question: item.question, answer: item.answer })), ...dynamicItems];
  const groups = Array.from(new Set(all.map((item) => item.group)));

  return (
    <div className="container-page grid gap-12 pb-24 pt-12 lg:grid-cols-12">
      <JsonLd data={faqJsonLd(all)} />
      <div className="lg:col-span-4">
        <p className="eyebrow">Yardım</p>
        <h1 className="display-lg mt-3 text-cocoa-900">Sıkça sorulan sorular</h1>
        {STATIC_SITE ? null : (
          <p className="mt-4 text-cocoa-600">
            Aradığınız yanıtı bulamadıysanız{" "}
            <Link href="/iletisim" className="font-bold text-bordeaux-600 underline">
              bize yazın
            </Link>
            .
          </p>
        )}
      </div>
      <div className="space-y-12 lg:col-span-8">
        {groups.map((group) => (
          <section key={group} aria-labelledby={`sss-${group}`}>
            <h2 id={`sss-${group}`} className="font-display text-2xl text-cocoa-900">
              {group}
            </h2>
            <div className="mt-4 border-t border-cocoa-800/12">
              {all
                .filter((item) => item.group === group)
                .map((item) => (
                  <details key={item.question} className="group border-b border-cocoa-800/12">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-bold text-cocoa-900 [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <ChevronDown className="size-5 flex-none transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <p className="pb-5 leading-relaxed text-cocoa-700">{item.answer}</p>
                  </details>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
