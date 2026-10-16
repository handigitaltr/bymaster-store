import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PACKAGE_TYPE_LABELS, type PackageType } from "@/lib/constants";
import { formatWeight } from "@/lib/money";
import { STATIC_SITE } from "@/lib/site-mode";
import { lines } from "@/lib/text";

function Missing() {
  if (STATIC_SITE) return <p className="text-cocoa-500">Bu bilgi henüz eklenmedi.</p>;
  return (
    <p className="text-cocoa-500">
      Bu bilgi henüz eklenmedi. Satın almadan önce bilgi almak için{" "}
      <Link href="/iletisim" className="font-semibold text-bordeaux-600 underline">
        bize ulaşabilirsiniz
      </Link>
      .
    </p>
  );
}

function Section({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group border-b border-cocoa-800/12" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[0.95rem] font-bold text-cocoa-900 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 flex-none transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-5 text-[0.95rem] leading-relaxed text-cocoa-700">{children}</div>
    </details>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
    </div>
  );
}

export function ProductInfo({
  product,
  variant,
  usageTags,
  shippingText,
  returnsHref,
}: {
  product: {
    kind: string;
    brand: string | null;
    description: string | null;
    ingredients: string | null;
    allergens: string | null;
    mayContain: string | null;
    storageConditions: string | null;
    shelfLife: string | null;
    usageAreasText: string | null;
    usageTips: string | null;
    kitContents: string | null;
    kitPreparation: string | null;
    servingInfo: string | null;
    originInfo: string | null;
  };
  variant: { packageType: string; netWeightGrams: number | null; unitsPerCase: number | null; sku: string } | null;
  usageTags: string[];
  shippingText: string[];
  returnsHref: string | null;
}) {
  const isKit = product.kind === "KIT";
  const contents = lines(product.kitContents);
  const steps = lines(product.kitPreparation);
  return (
    <div className="border-t border-cocoa-800/12">
      <Section title="Ürün hakkında" open>
        {product.description ? <Paragraphs text={product.description} /> : <Missing />}
      </Section>

      {isKit ? (
        <>
          <Section title="Kutu içeriği" open>
            {contents.length ? (
              <ul className="list-disc space-y-1.5 pl-5 marker:text-caramel-600">
                {contents.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <Missing />
            )}
          </Section>
          <Section title="Hazırlanış">
            {steps.length ? (
              <ol className="list-decimal space-y-1.5 pl-5 marker:font-bold marker:text-caramel-700">
                {steps.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            ) : (
              <Missing />
            )}
          </Section>
          <Section title="Porsiyon bilgisi">{product.servingInfo ? <Paragraphs text={product.servingInfo} /> : <Missing />}</Section>
        </>
      ) : null}

      <Section title="İçindekiler">{product.ingredients ? <Paragraphs text={product.ingredients} /> : <Missing />}</Section>

      <Section title="Alerjen bilgisi">
        {product.allergens || product.mayContain ? (
          <div className="space-y-2">
            {product.allergens ? <p>{product.allergens}</p> : null}
            {product.mayContain ? <p className="text-cocoa-600">Eser miktarda içerebilir: {product.mayContain}</p> : null}
          </div>
        ) : (
          <Missing />
        )}
      </Section>

      <Section title="Saklama koşulları ve raf ömrü">
        {product.storageConditions || product.shelfLife ? (
          <div className="space-y-2">
            {product.storageConditions ? <p>{product.storageConditions}</p> : null}
            {product.shelfLife ? <p>Raf ömrü: {product.shelfLife}</p> : null}
          </div>
        ) : (
          <Missing />
        )}
      </Section>

      <Section title="Kullanım alanları ve öneriler">
        {product.usageAreasText || product.usageTips || usageTags.length ? (
          <div className="space-y-3">
            {product.usageAreasText ? <p>{product.usageAreasText}</p> : null}
            {usageTags.length ? (
              <ul className="flex flex-wrap gap-2">
                {usageTags.map((tag) => (
                  <li key={tag} className="rounded-full bg-cream-200 px-3 py-1 text-xs font-bold text-cocoa-700">
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
            {product.usageTips ? <Paragraphs text={product.usageTips} /> : null}
          </div>
        ) : (
          <Missing />
        )}
      </Section>

      {variant ? (
        <Section title="Ambalaj ve net miktar">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="font-semibold text-cocoa-900">Ambalaj</dt>
            <dd>{PACKAGE_TYPE_LABELS[variant.packageType as PackageType] ?? variant.packageType}</dd>
            {variant.netWeightGrams ? (
              <>
                <dt className="font-semibold text-cocoa-900">Net miktar</dt>
                <dd>{formatWeight(variant.netWeightGrams)}</dd>
              </>
            ) : null}
            {variant.unitsPerCase ? (
              <>
                <dt className="font-semibold text-cocoa-900">Koli içi</dt>
                <dd>{variant.unitsPerCase} adet</dd>
              </>
            ) : null}
            {product.brand ? (
              <>
                <dt className="font-semibold text-cocoa-900">Marka</dt>
                <dd>{product.brand}</dd>
              </>
            ) : null}
            {product.originInfo ? (
              <>
                <dt className="font-semibold text-cocoa-900">Menşei</dt>
                <dd>{product.originInfo}</dd>
              </>
            ) : null}
            <dt className="font-semibold text-cocoa-900">Stok kodu</dt>
            <dd>{variant.sku}</dd>
          </dl>
        </Section>
      ) : null}

      {/* Statik vitrinde sipariş alınmadığı için teslimat bölümü gösterilmez */}
      {STATIC_SITE ? null : (
        <Section title="Teslimat ve iade">
          <div className="space-y-2">
            {shippingText.length ? shippingText.map((text) => <p key={text}>{text}</p>) : <p>Teslimat bilgisi ödeme adımında gösterilir.</p>}
            {returnsHref ? (
              <p>
                İade ve iptal koşulları için{" "}
                <Link href={returnsHref} className="font-semibold text-bordeaux-600 underline">
                  ilgili sayfayı
                </Link>{" "}
                inceleyebilirsiniz.
              </p>
            ) : null}
          </div>
        </Section>
      )}
    </div>
  );
}
