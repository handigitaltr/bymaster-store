"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Dialog } from "@/components/ui/Dialog";

type Consent = { v: 1; analytics: boolean; marketing: boolean; ts: number };
const COOKIE = "bm_consent";
export const OPEN_CONSENT_EVENT = "bm:cerez-tercihleri";

// Onay çerezi harici bir "depo" gibi okunur: sunucuda okunamaz (null), tarayıcıda ham değeri döner
const consentListeners = new Set<() => void>();

function subscribeConsent(callback: () => void) {
  consentListeners.add(callback);
  return () => {
    consentListeners.delete(callback);
  };
}

function readConsentCookie(): string {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${COOKIE}=`));
  return match ? match.slice(COOKIE.length + 1) : "";
}

function parseConsent(raw: string): Consent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Consent;
    return value.v === 1 ? value : null;
  } catch {
    return null;
  }
}

function readConsent(): Consent | null {
  return parseConsent(readConsentCookie());
}

function writeConsent(consent: Omit<Consent, "v" | "ts">) {
  const value: Consent = { v: 1, ts: Date.now(), ...consent };
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${secure}`;
  consentListeners.forEach((listener) => listener());
  return value;
}

/**
 * Çerez onayı: zorunlu dışındaki çerezler yalnızca açık onayla yüklenir.
 * Reddetmek, kabul etmek kadar kolaydır (KVKK Çerez Uygulamaları Rehberi).
 */
export function CookieConsent({
  gaMeasurementId,
  metaPixelId,
  policyHref,
}: {
  gaMeasurementId: string | null;
  metaPixelId: string | null;
  policyHref: string | null;
}) {
  const rawConsent = useSyncExternalStore(subscribeConsent, readConsentCookie, () => null);
  const consent = useMemo(() => (rawConsent ? parseConsent(rawConsent) : null), [rawConsent]);
  const ready = rawConsent !== null;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    const open = () => {
      const current = readConsent();
      setDraft({ analytics: current?.analytics ?? false, marketing: current?.marketing ?? false });
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  const save = useCallback((choice: { analytics: boolean; marketing: boolean }) => {
    const previous = readConsent();
    writeConsent(choice); // aboneler (useSyncExternalStore) yeni değeri okur
    setSettingsOpen(false);
    // Daha önce verilen bir onay geri alındıysa yüklenmiş betikleri kaldırmak için sayfayı yenile
    if ((previous?.analytics && !choice.analytics) || (previous?.marketing && !choice.marketing)) window.location.reload();
  }, []);

  const hasOptionalTools = Boolean(gaMeasurementId || metaPixelId);
  const showBanner = ready && !consent && hasOptionalTools;

  return (
    <>
      {consent?.analytics && gaMeasurementId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(gaMeasurementId)},{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
      {consent?.marketing && metaPixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(metaPixelId)});fbq('track','PageView');`}
        </Script>
      ) : null}

      {showBanner ? (
        <div
          role="region"
          aria-label="Çerez tercihleri"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-cocoa-800/10 bg-cream-50 p-5 shadow-2xl sm:inset-x-6 sm:bottom-6"
        >
          <p className="font-display text-lg text-cocoa-900">Çerez tercihleriniz</p>
          <p className="mt-1.5 text-sm leading-relaxed text-cocoa-600">
            Sitenin çalışması için zorunlu çerezler kullanıyoruz. Onay vermeniz hâlinde site kullanımını ölçmek ve reklamlarımızı
            iyileştirmek için analiz ve pazarlama çerezleri de kullanılır.
            {policyHref ? (
              <>
                {" "}
                <Link href={policyHref} className="font-semibold text-bordeaux-600 underline">
                  Çerez Politikası
                </Link>
              </>
            ) : null}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm btn-primary" onClick={() => save({ analytics: true, marketing: true })}>
              Tümünü kabul et
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => save({ analytics: false, marketing: false })}>
              Yalnızca zorunlu
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => {
                setDraft({ analytics: false, marketing: false });
                setSettingsOpen(true);
              }}
            >
              Tercihleri yönet
            </button>
          </div>
        </div>
      ) : null}

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Çerez tercihleri">
        <div className="space-y-4 p-5">
          <div className="rounded-xl bg-cream-200 p-4">
            <p className="font-bold text-cocoa-900">Zorunlu çerezler</p>
            <p className="mt-1 text-sm text-cocoa-600">Oturum, sepet ve güvenlik için gereklidir; kapatılamaz.</p>
          </div>
          {[
            { key: "analytics" as const, title: "Analiz çerezleri", text: "Site kullanımını anlamamıza yardımcı olur (Google Analytics).", enabled: Boolean(gaMeasurementId) },
            { key: "marketing" as const, title: "Pazarlama çerezleri", text: "Reklam performansını ölçmek için kullanılır (Meta Pixel).", enabled: Boolean(metaPixelId) },
          ].map((item) => (
            <label key={item.key} className="flex items-start justify-between gap-4 rounded-xl border border-cocoa-800/10 p-4">
              <span>
                <span className="block font-bold text-cocoa-900">{item.title}</span>
                <span className="mt-1 block text-sm text-cocoa-600">
                  {item.text}
                  {!item.enabled ? " Şu anda bu sitede kullanılmıyor." : ""}
                </span>
              </span>
              <input
                type="checkbox"
                className="checkbox mt-1"
                checked={draft[item.key]}
                onChange={(event) => setDraft((current) => ({ ...current, [item.key]: event.target.checked }))}
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" className="btn btn-primary" onClick={() => save(draft)}>
              Tercihleri kaydet
            </button>
            <button type="button" className="btn btn-outline" onClick={() => save({ analytics: false, marketing: false })}>
              Tümünü reddet
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
      Çerez tercihleri
    </button>
  );
}
