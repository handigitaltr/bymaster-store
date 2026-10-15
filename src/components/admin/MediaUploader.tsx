"use client";

import { ImagePlus, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cx } from "@/lib/utils";

/** Medya kitaplığına görsel yükler (sunucuda doğrulanır, WebP'ye dönüştürülür, meta veriler temizlenir) */
export function MediaUploader() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setMessage(null);
    let uploaded = 0;
    for (const file of Array.from(files).slice(0, 10)) {
      const body = new FormData();
      body.set("file", file);
      body.set("alt", file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "));
      try {
        const response = await fetch("/api/yonetim/yukle", { method: "POST", body });
        const data = (await response.json()) as { asset?: unknown; error?: string };
        if (!data.asset) {
          setMessage({ tone: "error", text: `${file.name}: ${data.error ?? "yüklenemedi"}` });
          break;
        }
        uploaded++;
      } catch {
        setMessage({ tone: "error", text: "Bağlantı hatası." });
        break;
      }
    }
    if (uploaded) {
      setMessage((current) => current ?? { tone: "ok", text: `${uploaded} görsel yüklendi.` });
      router.refresh();
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className={cx("btn btn-sm btn-primary cursor-pointer", busy && "pointer-events-none opacity-60")}>
        {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
        Görsel yükle
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => upload(e.target.files)} />
      </label>
      <span className="text-xs text-cocoa-500">JPG, PNG, WebP veya AVIF · en fazla 5 MB · tek seferde 10 dosya</span>
      {message ? (
        <p role="status" className={cx("w-full text-sm", message.tone === "ok" ? "text-[#21502c]" : "text-bordeaux-600")}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
