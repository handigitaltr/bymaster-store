// İzin tabanlı analitik olay yardımcıları (yalnızca kullanıcı onayıyla yüklenen betikler varsa çalışır)

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

const META_EVENTS: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  generate_lead: "Lead",
};

export type AnalyticsItem = { item_id: string; item_name: string; price: number; quantity: number };

export function track(event: string, params: { value?: number; currency?: string; items?: AnalyticsItem[]; transaction_id?: string } = {}) {
  if (typeof window === "undefined") return;
  const w = window as GtagWindow;
  try {
    w.gtag?.("event", event, { currency: "TRY", ...params });
    const metaEvent = META_EVENTS[event];
    if (metaEvent && w.fbq) {
      w.fbq("track", metaEvent, {
        currency: "TRY",
        value: params.value,
        content_ids: params.items?.map((item) => item.item_id),
        content_type: "product",
      });
    }
  } catch {
    // analitik hataları kullanıcı deneyimini etkilememeli
  }
}
