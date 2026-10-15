"use client";

import Image from "next/image";
import { Eye, ImagePlus, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { saveBlogPostAction } from "@/app/actions/admin/content";
import { Markdown } from "@/components/content/Markdown";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { AdminFormState } from "@/lib/admin-form";
import { slugify } from "@/lib/text";
import { useActionForm } from "@/lib/use-action-form";
import { cx } from "@/lib/utils";

export type EditorPost = {
  id?: string;
  title: string;
  slug: string;
  type: "ARTICLE" | "RECIPE" | "GUIDE";
  categoryId: string;
  tags: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  coverImageAlt: string;
  coverCredit: string;
  authorName: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  recipeYield: string;
  prepMinutes: string;
  cookMinutes: string;
  recipeIngredients: string;
  recipeSteps: string;
  products: Array<{ productId: string; note: string }>;
};

export function PostEditor({
  initial,
  categories,
  products,
}: {
  initial: EditorPost;
  categories: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; slug: string }>;
}) {
  const { state, formAction, onSubmit } = useActionForm<AdminFormState>(saveBlogPostAction, null);
  const [post, setPost] = useState(initial);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [embedSlug, setEmbedSlug] = useState(products[0]?.slug ?? "");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const set = <K extends keyof EditorPost>(key: K, value: EditorPost[K]) => setPost((current) => ({ ...current, [key]: value }));
  const error = (field: string) => state?.errors?.[field]?.[0];

  const field = (key: keyof EditorPost, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, className?: string) => (
    <div className={className}>
      <label htmlFor={`b-${String(key)}`} className="field-label">
        {label}
      </label>
      <input id={`b-${String(key)}`} name={String(key)} className="field-input" value={String(post[key] ?? "")} onChange={(e) => set(key, e.target.value as never)} aria-invalid={error(String(key)) ? true : undefined} {...props} />
      {error(String(key)) ? <p className="field-error">{error(String(key))}</p> : null}
    </div>
  );
  const area = (key: keyof EditorPost, label: string, rows: number, hint?: string, className?: string) => (
    <div className={className}>
      <label htmlFor={`b-${String(key)}`} className="field-label">
        {label}
      </label>
      <textarea id={`b-${String(key)}`} name={String(key)} rows={rows} className="field-input" value={String(post[key] ?? "")} onChange={(e) => set(key, e.target.value as never)} aria-invalid={error(String(key)) ? true : undefined} />
      {error(String(key)) ? <p className="field-error">{error(String(key))}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );

  const insertEmbed = () => {
    if (!embedSlug) return;
    const token = `\n\n[[urun:${embedSlug}]]\n\n`;
    const textarea = contentRef.current;
    const position = textarea ? textarea.selectionStart : post.content.length;
    set("content", `${post.content.slice(0, position)}${token}${post.content.slice(position)}`.replace(/\n{4,}/g, "\n\n\n"));
  };

  const uploadCover = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const body = new FormData();
    body.set("file", file);
    body.set("alt", post.title);
    try {
      const response = await fetch("/api/yonetim/yukle", { method: "POST", body });
      const data = (await response.json()) as { asset?: { url: string }; error?: string };
      if (data.asset) {
        set("coverImageUrl", data.asset.url);
        if (!post.coverImageAlt) set("coverImageAlt", post.title);
      } else setUploadError(data.error ?? "Yükleme başarısız.");
    } catch {
      setUploadError("Bağlantı hatası.");
    }
    setUploading(false);
  };

  return (
    <form action={formAction} onSubmit={onSubmit} className="space-y-6 pb-12">
      {post.id ? <input type="hidden" name="id" value={post.id} /> : null}
      <input type="hidden" name="products" value={JSON.stringify(post.products.filter((p) => p.productId))} />
      {state?.message ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}

      <section className="grid gap-4 rounded-2xl border border-cocoa-800/10 bg-white p-5 md:grid-cols-2">
        {field("title", "Başlık", { maxLength: 160 }, "md:col-span-2")}
        <div>
          {field("slug", "Adres (slug)", { placeholder: slugify(post.title) })}
          <p className="field-hint">/tarifler/{slugify(post.slug || post.title) || "…"}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="b-type" className="field-label">
              Tür
            </label>
            <select id="b-type" name="type" className="field-input" value={post.type} onChange={(e) => set("type", e.target.value as EditorPost["type"])}>
              <option value="ARTICLE">Yazı</option>
              <option value="RECIPE">Tarif</option>
              <option value="GUIDE">Rehber</option>
            </select>
          </div>
          <div>
            <label htmlFor="b-category" className="field-label">
              Kategori
            </label>
            <select id="b-category" name="categoryId" className="field-input" value={post.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Kategorisiz</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {area("excerpt", "Giriş paragrafı (liste ve paylaşımlarda görünür)", 3, undefined, "md:col-span-2")}
        {field("tags", "Etiketler (virgülle ayırın)")}
        {field("authorName", "Yazar")}
      </section>

      <section className="rounded-2xl border border-cocoa-800/10 bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">İçerik (Markdown)</h2>
            <p className="text-xs text-cocoa-500">## Ara başlık · **kalın** · - liste · [bağlantı](/urunler) · tablo. Ham HTML desteklenmez (güvenlik).</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={embedSlug} onChange={(e) => setEmbedSlug(e.target.value)} className="field-input !min-h-9 !w-56 !py-1 text-xs" aria-label="Yazıya eklenecek ürün">
              {products.map((product) => (
                <option key={product.id} value={product.slug}>
                  {product.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={insertEmbed} className="btn btn-sm btn-outline">
              <Plus className="size-4" aria-hidden="true" /> Ürün kartı ekle
            </button>
            <button type="button" onClick={() => setPreview((v) => !v)} className={cx("btn btn-sm", preview ? "btn-primary" : "btn-outline")}>
              <Eye className="size-4" aria-hidden="true" /> {preview ? "Düzenle" : "Önizle"}
            </button>
          </div>
        </div>
        <div className="mt-4">
          <textarea
            ref={contentRef}
            id="b-content"
            name="content"
            rows={24}
            className={cx("field-input font-mono text-sm leading-relaxed", preview && "hidden")}
            value={post.content}
            onChange={(e) => set("content", e.target.value)}
            aria-label="İçerik"
            aria-invalid={error("content") ? true : undefined}
          />
          {preview ? (
            <div className="rounded-xl border border-cocoa-800/10 p-6">
              <Markdown content={post.content.replace(/^\s*\[\[urun:([a-z0-9-]+)\]\]\s*$/gm, "> **Ürün kartı:** $1")} />
            </div>
          ) : null}
          {error("content") ? <p className="field-error">{error("content")}</p> : null}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-cocoa-800/10 bg-white p-5 md:grid-cols-2">
        <h2 className="font-display text-xl md:col-span-2">Kapak görseli</h2>
        <div className="relative aspect-video overflow-hidden rounded-xl bg-cream-200">
          {post.coverImageUrl ? <Image src={post.coverImageUrl} alt={post.coverImageAlt} fill sizes="400px" className="object-cover" /> : null}
        </div>
        <div className="space-y-3">
          <label className={cx("btn btn-sm btn-primary cursor-pointer", uploading && "pointer-events-none opacity-60")}>
            {uploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
            Görsel yükle
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => uploadCover(e.target.files?.[0])} />
          </label>
          {uploadError ? <p className="field-error">{uploadError}</p> : null}
          {field("coverImageUrl", "veya görsel yolu", { placeholder: "/images/editorial/…jpg" })}
          {field("coverImageAlt", "Alt metin")}
          {field("coverCredit", "Görsel kaynağı (ör. Fotoğraf: Unsplash)")}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-cocoa-800/10 bg-white p-5 md:grid-cols-3">
        <h2 className="font-display text-xl md:col-span-3">Tarif kartı {post.type !== "RECIPE" ? <span className="text-sm text-cocoa-500">(tür “Tarif” seçilince gösterilir)</span> : null}</h2>
        {field("recipeYield", "Porsiyon / verim")}
        {field("prepMinutes", "Hazırlık (dk)", { inputMode: "numeric" })}
        {field("cookMinutes", "Pişirme (dk)", { inputMode: "numeric" })}
        {area("recipeIngredients", "Malzemeler (her satıra bir)", 6, undefined, "md:col-span-3 lg:col-span-1")}
        {area("recipeSteps", "Adımlar (her satıra bir)", 6, undefined, "md:col-span-3 lg:col-span-2")}
      </section>

      <section className="rounded-2xl border border-cocoa-800/10 bg-white p-5">
        <h2 className="font-display text-xl">Bu yazıda kullanılan ürünler</h2>
        <p className="text-xs text-cocoa-500">Yazının yanında “Tariften sepete” bölümünde listelenir; satılabilir olanlar tek tıkla sepete eklenebilir.</p>
        <div className="mt-4 space-y-2">
          {post.products.map((row, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <select
                className="field-input !min-h-10 !py-1.5 text-sm"
                value={row.productId}
                onChange={(e) => set("products", post.products.map((p, i) => (i === index ? { ...p, productId: e.target.value } : p)))}
                aria-label="Ürün"
              >
                <option value="">Ürün seçin</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <input
                className="field-input !min-h-10 !py-1.5 text-sm"
                placeholder="Not (ör. servis için)"
                value={row.note}
                onChange={(e) => set("products", post.products.map((p, i) => (i === index ? { ...p, note: e.target.value } : p)))}
                aria-label="Not"
              />
              <button type="button" onClick={() => set("products", post.products.filter((_, i) => i !== index))} className="grid size-10 place-content-center rounded-full text-bordeaux-600 hover:bg-bordeaux-50" aria-label="Kaldır">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => set("products", [...post.products, { productId: "", note: "" }])} className="inline-flex items-center gap-2 text-sm font-bold text-bordeaux-600">
            <Plus className="size-4" aria-hidden="true" /> Ürün ekle
          </button>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-cocoa-800/10 bg-white p-5 md:grid-cols-2">
        <h2 className="font-display text-xl md:col-span-2">Yayın ve SEO</h2>
        <div>
          <label htmlFor="b-status" className="field-label">
            Durum
          </label>
          <select id="b-status" name="status" className="field-input" value={post.status} onChange={(e) => set("status", e.target.value as EditorPost["status"])}>
            <option value="DRAFT">Taslak (sitede görünmez)</option>
            <option value="PUBLISHED">Yayında</option>
          </select>
        </div>
        {field("publishedAt", "Yayın tarihi (ileri tarih = zamanlanmış)", { type: "datetime-local" })}
        {field("seoTitle", `SEO başlığı (${post.seoTitle.length}/70)`, { maxLength: 70, placeholder: post.title })}
        {field("seoDescription", `SEO açıklaması (${post.seoDescription.length}/170)`, { maxLength: 170, placeholder: post.excerpt.slice(0, 160) })}
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <SubmitButton className="shadow-lg" pendingLabel="Kaydediliyor…">
          {post.status === "PUBLISHED" ? "Kaydet ve yayınla" : "Taslağı kaydet"}
        </SubmitButton>
      </div>
    </form>
  );
}
