import Image from "next/image";

export function AuthShell({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-8rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-cocoa-900 lg:block">
        <Image src="/images/editorial/doku-sutlu-cikolata.jpg" alt="" fill sizes="50vw" className="object-cover opacity-70" priority />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-cocoa-950/80 via-cocoa-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-cream-50">
          <p className="eyebrow eyebrow-light">ByMaster</p>
          <p className="mt-3 max-w-md font-display text-4xl leading-tight">Siparişleriniz, adresleriniz ve favorileriniz tek yerde.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-14 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="display-md text-cocoa-900">{title}</h1>
          {description ? <p className="mt-3 text-cocoa-600">{description}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
