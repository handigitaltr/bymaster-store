"use client";

import { Eye, PencilLine } from "lucide-react";
import { useState } from "react";
import { savePageAction } from "@/app/actions/admin/content";
import { Markdown } from "@/components/content/Markdown";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { AdminFormState } from "@/lib/admin-form";
import { useActionForm } from "@/lib/use-action-form";
import { cx } from "@/lib/utils";

export type EditorPage = {
  id?: string;
  title: string;
  slug: string;
  kind: "INFO" | "LEGAL";
  content: string;
  status: "DRAFT" | "PUBLISHED";
  seoTitle: string;
  seoDescription: string;
};

/**
 * Sayfa / yasal metin editörü. Önizleme, {{DEGISKEN}} alanlarını site ayarlarındaki değerlerle doldurur;
 * ayarlarda eksik olan alanlar önizlemede açıkça işaretlenir.
 */
export function PageEditor({ initial, vars, lockedSlug }: { initial: EditorPage; vars: Record<string, string>; lockedSlug?: boolean }) {
  const { state, formAction, onSubmit } = useActionForm<AdminFormState>(savePageAction, null);
  const [page, setPage] = useState(initial);
  const [preview, setPreview] = useState(false);
  const set = <K extends keyof EditorPage>(key: K, value: EditorPage[K]) => setPage((current) => ({ ...current, [key]: value }));
  const error = (field: string) => state?.errors?.[field]?.[0];
  const used = Array.from(new Set(Array.from(page.content.matchAll(/\{\{([A-Z_]+)\}\}/g), (m) => m[1])));
  const missing = used.filter((key) => !(key in vars));
  const rendered = page.content.replace(/\{\{([A-Z_]+)\}\}/g, (_, key: string) => vars[key] ?? `**[${key} — bilgi eksik]**`);

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-6 pb-12">
      {page.id ? <input type="hidden" name="id" value={page.id} /> : null}
      {state?.message ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      <section className="grid gap-4 rounded-2xl border border-cocoa-800/10 bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="p-title" className="field-label">
            Başlık
          </label>
          <input id="p-title" name="title" className="field-input" value={page.title} onChange={(e) => set("title", e.target.value)} aria-invalid={error("title") ? true : undefined} />
          {error("title") ? <p className="field-error">{error("title")}</p> : null}
        </div>
        <div>
          <label htmlFor="p-slug" className="field-label">
            Adres
          </label>
          <input id="p-slug" name="slug" className="field-input" value={page.slug} readOnly={lockedSlug} onChange={(e) => set("slug", e.target.value)} aria-invalid={error("slug") ? true : undefined} />
          {error("slug") ? <p className="field-error">{error("slug")}</p> : <p className="field-hint">{lockedSlug ? "Sistem sayfası: adres sabittir (ödeme adımı bu sayfaya bağlanır)." : `/sayfa/${page.slug || "…"}`}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="p-kind" className="field-label">
              Tür
            </label>
            <select id="p-kind" name="kind" className="field-input" value={page.kind} onChange={(e) => set("kind", e.target.value as EditorPage["kind"])}>
              <option value="INFO">Bilgi sayfası</option>
              <option value="LEGAL">Yasal metin</option>
            </select>
          </div>
          <div>
            <label htmlFor="p-status" className="field-label">
              Durum
            </label>
            <select id="p-status" name="status" className="field-input" value={page.status} onChange={(e) => set("status", e.target.value as EditorPage["status"])}>
              <option value="DRAFT">Taslak</option>
              <option value="PUBLISHED">Yayında</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-cocoa-800/10 bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">İçerik</h2>
            <p className="text-xs text-cocoa-500">
              Markdown. <code>{"{{SATICI_UNVAN}}"}</code> gibi alanlar site ayarlarından, <code>{"{{ALICI_AD}}"}</code> gibi sipariş alanları ödeme sırasında doldurulur.
            </p>
          </div>
          <button type="button" onClick={() => setPreview((v) => !v)} className={cx("btn btn-sm", preview ? "btn-primary" : "btn-outline")}>
            {preview ? <PencilLine className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />} {preview ? "Düzenle" : "Önizle"}
          </button>
        </div>
        {missing.length > 0 ? (
          <div className="mt-4">
            <Alert tone="warning" title="Site ayarlarında eksik bilgiler var">
              Bu metinde kullanılan şu alanlar henüz doldurulmadı: {missing.join(", ")}. Yayınlamadan önce Site ayarları sayfasından tamamlayın; müşteriye gösterilen metinde bu alanlar “—” olarak görünür.
            </Alert>
          </div>
        ) : null}
        <div className="mt-4">
          <textarea
            id="p-content"
            name="content"
            rows={28}
            className={cx("field-input font-mono text-sm leading-relaxed", preview && "hidden")}
            value={page.content}
            onChange={(e) => set("content", e.target.value)}
            aria-label="İçerik"
            aria-invalid={error("content") ? true : undefined}
          />
          {preview ? (
            <div className="rounded-xl border border-cocoa-800/10 p-6">
              <Markdown content={rendered} />
            </div>
          ) : null}
          {error("content") ? <p className="field-error">{error("content")}</p> : null}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-cocoa-800/10 bg-white p-5 md:grid-cols-2">
        <h2 className="font-display text-xl md:col-span-2">SEO</h2>
        <div>
          <label htmlFor="p-seoTitle" className="field-label">
            SEO başlığı ({page.seoTitle.length}/70)
          </label>
          <input id="p-seoTitle" name="seoTitle" maxLength={70} className="field-input" value={page.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
        </div>
        <div>
          <label htmlFor="p-seoDescription" className="field-label">
            SEO açıklaması ({page.seoDescription.length}/170)
          </label>
          <input id="p-seoDescription" name="seoDescription" maxLength={170} className="field-input" value={page.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
        </div>
      </section>

      {page.kind === "LEGAL" && page.status === "PUBLISHED" ? (
        <Alert tone="info">
          Yasal metinler şablon olarak hazırlanmıştır. Yayınlamadan önce içeriğin işletmenize uygunluğunu bir hukuk danışmanına kontrol ettirin.
        </Alert>
      ) : null}

      <div className="sticky bottom-4 flex justify-end">
        <SubmitButton className="shadow-lg" pendingLabel="Kaydediliyor…">
          {page.status === "PUBLISHED" ? "Kaydet ve yayınla" : "Taslağı kaydet"}
        </SubmitButton>
      </div>
    </form>
  );
}
