import Image from "next/image";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";

export function CatalogHeader({
  eyebrow,
  title,
  description,
  crumbs,
  imageUrl,
  imageAlt,
  children,
}: {
  eyebrow?: string | null;
  title: React.ReactNode;
  description?: string | null;
  crumbs: Crumb[];
  imageUrl?: string | null;
  imageAlt?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative mb-10 overflow-hidden bg-cream-200">
      <div className="container-page relative grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-end lg:py-14">
        <div className="max-w-2xl">
          <Breadcrumbs items={crumbs} />
          {eyebrow ? <p className="eyebrow mt-8">{eyebrow}</p> : <div className="mt-8" />}
          <h1 className="display-lg mt-3 text-cocoa-900">{title}</h1>
          {description ? <p className="mt-4 text-base leading-relaxed text-cocoa-600 md:text-lg">{description}</p> : null}
          {children}
        </div>
        {imageUrl ? (
          <div className="relative hidden size-48 overflow-hidden rounded-full bg-cream-50 md:block lg:size-56">
            <Image src={imageUrl} alt={imageAlt ?? ""} fill sizes="224px" className="object-contain p-6 mix-blend-multiply" priority />
          </div>
        ) : null}
      </div>
    </section>
  );
}
