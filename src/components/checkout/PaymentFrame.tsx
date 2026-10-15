"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    iFrameResize?: (options: Record<string, unknown>, selector: string) => void;
  }
}

/** PayTR iFrame API ödeme formu (kart bilgileri doğrudan PayTR'ye girilir) */
export function PaytrFrame({ src }: { src: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready && window.iFrameResize) window.iFrameResize({}, "#paytriframe");
  }, [ready]);
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-cocoa-800/10 bg-white">
      <Script src="https://www.paytr.com/js/iframeResizer.min.js" strategy="afterInteractive" onReady={() => setReady(true)} />
      <iframe id="paytriframe" src={src} title="PayTR güvenli ödeme formu" className="block min-h-[620px] w-full border-0" scrolling="no" />
    </div>
  );
}

/** Ödeme rezervasyon süresi için geri sayım (gerçek son tarihten hesaplanır) */
export function ReservationCountdown({ until }: { until: string }) {
  // Sunucu ve istemci saatinin farklı olabileceği ilk çizimde boş kalır; saat yalnızca tarayıcıda okunur
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  if (now === null) return null;
  const remaining = Math.max(0, new Date(until).getTime() - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return (
    <span className="tabular-nums">
      {remaining === 0 ? "süre doldu" : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
    </span>
  );
}
