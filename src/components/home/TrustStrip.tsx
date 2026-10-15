import { Boxes, MessageSquare, PackageCheck, Scale, Truck } from "lucide-react";

export function TrustStrip({
  productCount,
  categoryCount,
  formats,
  supportLine,
}: {
  productCount: number;
  categoryCount: number;
  formats: string;
  supportLine: string;
}) {
  const items = [
    { icon: Boxes, title: "Ürün çeşitliliği", text: `${categoryCount} kategoride ${productCount} ürün.` },
    { icon: PackageCheck, title: "Profesyonel ambalajlar", text: formats },
    { icon: Scale, title: "Net miktar ve birim fiyat", text: "Her ürünün net miktarı, KDV dahil fiyatı ve kilogram fiyatı açıkça belirtilir." },
    { icon: Truck, title: "Sipariş takibi", text: "Sipariş durumunu ve kargo takip numarasını hesabınızdan ya da sipariş numaranızla izleyin." },
    { icon: MessageSquare, title: "Müşteri desteği", text: supportLine },
  ];
  return (
    <section className="border-t border-cocoa-800/10 bg-cream-200" aria-label="Alışveriş bilgileri">
      <div className="container-page grid gap-x-8 gap-y-8 py-14 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <div key={item.title} className="flex gap-4 lg:flex-col lg:gap-3">
            <item.icon className="size-6 flex-none text-caramel-700" aria-hidden="true" strokeWidth={1.6} />
            <div>
              <p className="font-display text-lg text-cocoa-900">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-cocoa-600">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
