"use client";

import { useRouter } from "next/navigation";
import { Check, Copy, LoaderCircle, RotateCcw } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { reorderAction } from "@/app/actions/cart";
import { useCart } from "@/components/cart/CartProvider";
import { Dialog } from "@/components/ui/Dialog";
import { Markdown } from "@/components/content/Markdown";
import { track } from "@/lib/analytics";

/** Ödeme dönüşünde, sağlayıcı bildirimi henüz işlenmediyse durumu kısa süre sorgular */
export function PaymentStatusPoller({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(`/api/siparis/${orderNumber}/durum`, { cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as { status: string; paymentStatus: string };
          if (data.status !== "PENDING_PAYMENT" || data.paymentStatus === "PAID") {
            clearInterval(timer);
            router.refresh();
            return;
          }
        }
      } catch {
        // geçici ağ hatası
      }
      if (attempts >= 20) {
        clearInterval(timer);
        setTimedOut(true);
        router.refresh();
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [orderNumber, router]);

  return (
    <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-cocoa-700" role="status">
      {timedOut ? (
        "Ödeme sağlayıcısından onay henüz gelmedi. Kartınızdan çekim yapıldıysa sipariş durumunuz kısa süre içinde güncellenecektir."
      ) : (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Ödemeniz doğrulanıyor…
        </>
      )}
    </p>
  );
}

export function TrackPurchase({
  orderNumber,
  totalKurus,
  items,
}: {
  orderNumber: string;
  totalKurus: number;
  items: Array<{ id: string; name: string; priceKurus: number; quantity: number }>;
}) {
  useEffect(() => {
    const key = `bm:olcum:${orderNumber}`;
    try {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, "1");
    } catch {
      return;
    }
    track("purchase", {
      transaction_id: orderNumber,
      value: totalKurus / 100,
      items: items.map((item) => ({ item_id: item.id, item_name: item.name, price: item.priceKurus / 100, quantity: item.quantity })),
    });
  }, [orderNumber, totalKurus, items]);
  return null;
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // pano izni yoksa sessizce geç
        }
      }}
      className="inline-flex items-center gap-1 rounded-full border border-cocoa-800/15 px-2.5 py-1 text-xs font-bold text-cocoa-700 hover:border-cocoa-800/40"
      aria-label={`${label} kopyala`}
    >
      {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      {copied ? "Kopyalandı" : "Kopyala"}
    </button>
  );
}

export function ReorderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { refresh } = useCart();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [partial, setPartial] = useState(false);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await reorderAction(orderId);
            await refresh();
            if (result.added > 0 && result.skipped.length === 0) {
              router.push("/sepet");
            } else {
              setPartial(result.added > 0);
              setMessage(result.skipped.join(" · ") || "Ürünler sepete eklenemedi.");
            }
          })
        }
        className="btn btn-outline"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
        Tekrar sipariş ver
      </button>
      {message ? (
        <div role="alert" className="mt-2 text-sm font-semibold text-danger">
          <p>{partial ? `Bazı ürünler eklenemedi: ${message}` : message}</p>
          {partial ? (
            <a href="/sepet" className="mt-1 inline-block text-bordeaux-600 underline">
              Sepete git
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AgreementButton({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-bold text-bordeaux-600 underline">
        {title}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title} description="Sipariş anında onayladığınız metin" className="!w-[min(52rem,calc(100vw-1.5rem))]">
        <div className="p-5 sm:p-7">
          <Markdown content={content} compact />
        </div>
      </Dialog>
    </>
  );
}
