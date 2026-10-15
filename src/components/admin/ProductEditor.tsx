"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveProductAction } from "@/app/actions/admin/products";
import { Alert } from "@/components/ui/Alert";
import type { AdminFormState } from "@/lib/admin-form";
import { PACKAGE_TYPE_LABELS, PACKAGE_TYPES, PRODUCT_STATUS_LABELS, SALE_STATUS_LABELS } from "@/lib/constants";
import { slugify } from "@/lib/text";
import { useActionForm } from "@/lib/use-action-form";
import { cx } from "@/lib/utils";
import { newVariant, type EditorImage, type EditorProduct, type EditorVariant } from "@/lib/product-editor";

export type { EditorImage, EditorProduct, EditorVariant };

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-cocoa-800/10 bg-white p-5 sm:p-6">
      <h2 className="font-display text-xl text-cocoa-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-cocoa-500">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

const num = (value: string) => (value.trim() === "" ? null : Number(value));

export function ProductEditor({
  initial,
  categories,
  tags,
  products,
  publicUrl,
}: {
  initial: EditorProduct;
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string; type: string }>;
  products: Array<{ id: string; name: string }>;
  publicUrl: string | null;
}) {
  const { state, formAction, onSubmit } = useActionForm<AdminFormState>(saveProductAction, null, {
    prepare: (formData) => formData.set("payload", payload()),
  });
  const [product, setProduct] = useState<EditorProduct>(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pathInput, setPathInput] = useState("");
  const [relatedQuery, setRelatedQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof EditorProduct>(key: K, value: EditorProduct[K]) => setProduct((current) => ({ ...current, [key]: value }));
  const setVariant = (key: string, patch: Partial<EditorVariant>) =>
    setProduct((current) => ({ ...current, variants: current.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)) }));
  const setImage = (index: number, patch: Partial<EditorImage>) =>
    setProduct((current) => ({ ...current, images: current.images.map((image, i) => (i === index ? { ...image, ...patch } : image)) }));
  const moveImage = (index: number, delta: number) =>
    setProduct((current) => {
      const images = [...current.images];
      const target = index + delta;
      if (target < 0 || target >= images.length) return current;
      [images[index], images[target]] = [images[target], images[index]];
      return { ...current, images };
    });

  const payload = () =>
    JSON.stringify({
      id: product.id,
      name: product.name,
      slug: product.slug,
      subtitle: product.subtitle,
      brand: product.brand,
      kind: product.kind,
      status: product.status,
      saleStatus: product.saleStatus,
      primaryCategoryId: product.primaryCategoryId,
      categoryIds: product.categoryIds,
      shortDescription: product.shortDescription,
      description: product.description,
      ingredients: product.ingredients,
      allergens: product.allergens,
      mayContain: product.mayContain,
      storageConditions: product.storageConditions,
      shelfLife: product.shelfLife,
      usageAreasText: product.usageAreasText,
      usageTips: product.usageTips,
      kitContents: product.kitContents,
      kitPreparation: product.kitPreparation,
      servingInfo: product.servingInfo,
      originInfo: product.originInfo,
      accentColor: product.accentColor,
      isFeatured: product.isFeatured,
      freeShipping: product.freeShipping,
      sortOrder: Number(product.sortOrder) || 0,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      tagIds: product.tagIds,
      relatedIds: product.relatedIds,
      images: product.images,
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        packageType: v.packageType,
        netWeightGrams: num(v.netWeightGrams),
        unitsPerCase: num(v.unitsPerCase),
        price: v.price,
        compareAtPrice: v.compareAtPrice || undefined,
        vatRate: Number(v.vatRate),
        trackStock: v.trackStock,
        initialStock: v.id ? undefined : Number(v.initialStock || 0),
        lowStockThreshold: Number(v.lowStockThreshold || 0),
        minOrderQty: Number(v.minOrderQty || 1),
        maxOrderQty: num(v.maxOrderQty),
        servingGrams: num(v.servingGrams),
        isActive: v.isActive,
        isDefault: v.isDefault,
      })),
    });

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setUploadError(null);
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.set("file", file);
      body.set("alt", product.name);
      try {
        const response = await fetch("/api/yonetim/yukle", { method: "POST", body });
        const data = (await response.json()) as { asset?: { url: string }; fit?: "contain" | "cover"; error?: string };
        if (!response.ok || !data.asset) {
          setUploadError(data.error ?? "Yükleme başarısız.");
          continue;
        }
        setProduct((current) => ({
          ...current,
          images: [...current.images, { url: data.asset!.url, alt: current.name || "Ürün görseli", isPlaceholder: false, fit: data.fit ?? "contain", kind: "PACKSHOT" }],
        }));
      } catch {
        setUploadError("Yükleme sırasında bağlantı hatası oluştu.");
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const flavorTags = tags.filter((tag) => tag.type === "FLAVOR");
  const usageTags = tags.filter((tag) => tag.type === "USAGE");
  const relatedOptions = useMemo(
    () =>
      products
        .filter((p) => p.id !== product.id)
        .filter((p) => !relatedQuery || p.name.toLocaleLowerCase("tr-TR").includes(relatedQuery.toLocaleLowerCase("tr-TR"))),
    [products, product.id, relatedQuery],
  );

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const input = (key: keyof EditorProduct, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}, className?: string) => (
    <div className={className}>
      <label htmlFor={`p-${String(key)}`} className="field-label">
        {label}
      </label>
      <input
        id={`p-${String(key)}`}
        className="field-input"
        value={String(product[key] ?? "")}
        onChange={(event) => set(key, event.target.value as never)}
        {...extra}
      />
    </div>
  );
  const textarea = (key: keyof EditorProduct, label: string, rows = 3, hint?: string, className?: string) => (
    <div className={className}>
      <label htmlFor={`p-${String(key)}`} className="field-label">
        {label}
      </label>
      <textarea id={`p-${String(key)}`} rows={rows} className="field-input" value={String(product[key] ?? "")} onChange={(event) => set(key, event.target.value as never)} />
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );

  return (
    <form
      action={(formData) => {
        formData.set("payload", payload());
        formAction(formData);
      }}
      onSubmit={onSubmit}
      className="space-y-6 pb-28"
    >
      {state?.message ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}

      <Section title="Temel bilgiler">
        <div className="grid gap-4 md:grid-cols-2">
          {input("name", "Ürün adı", { required: true, maxLength: 140 }, "md:col-span-2")}
          <div>
            <label htmlFor="p-slug" className="field-label">
              Adres (slug)
            </label>
            <input id="p-slug" className="field-input" value={product.slug} placeholder={slugify(product.name)} onChange={(event) => set("slug", event.target.value)} />
            <p className="field-hint">/urun/{slugify(product.slug || product.name) || "…"}</p>
          </div>
          {input("subtitle", "Alt başlık (ör. 10 kg kova)", { maxLength: 140 })}
          {input("brand", "Marka (bilinmiyorsa boş)", { maxLength: 60 })}
          <div>
            <label htmlFor="p-kind" className="field-label">
              Ürün türü
            </label>
            <select id="p-kind" className="field-input" value={product.kind} onChange={(event) => set("kind", event.target.value as EditorProduct["kind"])}>
              <option value="SIMPLE">Standart ürün</option>
              <option value="KIT">Kit / kutu</option>
            </select>
          </div>
          <div>
            <label htmlFor="p-status" className="field-label">
              Yayın durumu
            </label>
            <select id="p-status" className="field-input" value={product.status} onChange={(event) => set("status", event.target.value as EditorProduct["status"])}>
              {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="p-sale" className="field-label">
              Satış durumu
            </label>
            <select id="p-sale" className="field-input" value={product.saleStatus} onChange={(event) => set("saleStatus", event.target.value as EditorProduct["saleStatus"])}>
              {Object.entries(SALE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="field-hint">“Yakında”: ürün görünür, satın alınamaz; “Haber ver” listesi toplanır.</p>
          </div>
          {input("sortOrder", "Sıralama (küçük önce)", { type: "number" })}
          <div>
            <label htmlFor="p-accent" className="field-label">
              Vurgu rengi (kart zemini ve lezzet haritası)
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                aria-label="Renk seçici"
                className="h-[2.9rem] w-14 cursor-pointer rounded-lg border border-cream-500"
                value={/^#[0-9A-Fa-f]{6}$/.test(product.accentColor) ? product.accentColor : "#bc8855"}
                onChange={(event) => set("accentColor", event.target.value)}
              />
              <input id="p-accent" className="field-input" value={product.accentColor} placeholder="#BC8855" onChange={(event) => set("accentColor", event.target.value)} />
            </div>
          </div>
          <div className="flex flex-col justify-end gap-3 md:col-span-2 md:flex-row md:items-center md:gap-8">
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" className="checkbox !mt-0" checked={product.isFeatured} onChange={(event) => set("isFeatured", event.target.checked)} /> Öne çıkan (ana sayfa)
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" className="checkbox !mt-0" checked={product.freeShipping} onChange={(event) => set("freeShipping", event.target.checked)} /> Kargo ücretsiz
            </label>
          </div>
        </div>
      </Section>

      <Section title="Kategoriler ve etiketler" description="Birincil kategori, ürün sayfasındaki konum ve canonical adres için kullanılır.">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="p-primary" className="field-label">
              Birincil kategori
            </label>
            <select id="p-primary" className="field-input" value={product.primaryCategoryId} onChange={(event) => set("primaryCategoryId", event.target.value)}>
              <option value="">Seçin</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="field-label mt-5">Diğer kategoriler</p>
            <div className="grid gap-1.5">
              {categories
                .filter((category) => category.id !== product.primaryCategoryId)
                .map((category) => (
                  <label key={category.id} className="flex items-center gap-2.5 text-sm">
                    <input type="checkbox" className="checkbox !mt-0" checked={product.categoryIds.includes(category.id)} onChange={() => set("categoryIds", toggle(product.categoryIds, category.id))} />
                    {category.name}
                  </label>
                ))}
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <p className="field-label">Lezzet ailesi</p>
              <div className="flex flex-wrap gap-2">
                {flavorTags.map((tag) => (
                  <label key={tag.id} className={cx("cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold", product.tagIds.includes(tag.id) ? "border-cocoa-800 bg-cocoa-800 text-cream-50" : "border-cocoa-800/20")}>
                    <input type="checkbox" className="sr-only" checked={product.tagIds.includes(tag.id)} onChange={() => set("tagIds", toggle(product.tagIds, tag.id))} />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="field-label">Kullanım alanları</p>
              <div className="flex flex-wrap gap-2">
                {usageTags.map((tag) => (
                  <label key={tag.id} className={cx("cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold", product.tagIds.includes(tag.id) ? "border-cocoa-800 bg-cocoa-800 text-cream-50" : "border-cocoa-800/20")}>
                    <input type="checkbox" className="sr-only" checked={product.tagIds.includes(tag.id)} onChange={() => set("tagIds", toggle(product.tagIds, tag.id))} />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Görseller" description="İlk görsel kartlarda ve paylaşımlarda kullanılır. Gerçek ürün fotoğrafı olmayan görselleri “temsili” olarak işaretleyin.">
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {product.images.map((image, index) => (
            <li key={`${image.url}-${index}`} className="rounded-xl border border-cocoa-800/10 p-3">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-cream-200">
                <Image src={image.url} alt={image.alt} fill sizes="240px" className={image.fit === "cover" ? "object-cover" : "object-contain p-2 mix-blend-multiply"} />
                {index === 0 ? <span className="absolute left-2 top-2 pill bg-cocoa-800 text-cream-50">Ana görsel</span> : null}
              </div>
              <label className="field-label mt-3" htmlFor={`img-alt-${index}`}>
                Alt metin
              </label>
              <input id={`img-alt-${index}`} className="field-input !min-h-9 !py-1.5 text-sm" value={image.alt} onChange={(event) => setImage(index, { alt: event.target.value })} />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select className="field-input !min-h-9 !py-1 text-xs" value={image.fit} onChange={(event) => setImage(index, { fit: event.target.value as EditorImage["fit"] })} aria-label="Yerleşim">
                  <option value="contain">Sığdır (beyaz zemin)</option>
                  <option value="cover">Doldur (kadraj)</option>
                </select>
                <select className="field-input !min-h-9 !py-1 text-xs" value={image.kind} onChange={(event) => setImage(index, { kind: event.target.value as EditorImage["kind"] })} aria-label="Görsel türü">
                  <option value="PACKSHOT">Ambalaj</option>
                  <option value="DETAIL">Detay</option>
                  <option value="LIFESTYLE">Sunum</option>
                </select>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs font-semibold">
                <input type="checkbox" className="checkbox !mt-0" checked={image.isPlaceholder} onChange={(event) => setImage(index, { isPlaceholder: event.target.checked })} /> Temsili görsel
              </label>
              <div className="mt-2 flex gap-1">
                <button type="button" onClick={() => moveImage(index, -1)} className="grid size-8 place-content-center rounded-full hover:bg-cream-200" aria-label="Yukarı taşı">
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" onClick={() => moveImage(index, 1)} className="grid size-8 place-content-center rounded-full hover:bg-cream-200" aria-label="Aşağı taşı">
                  <ArrowDown className="size-4" />
                </button>
                <button type="button" onClick={() => set("images", product.images.filter((_, i) => i !== index))} className="ml-auto grid size-8 place-content-center rounded-full text-bordeaux-600 hover:bg-bordeaux-50" aria-label="Görseli kaldır">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" id="p-upload" onChange={(event) => upload(event.target.files)} />
          <label htmlFor="p-upload" className={cx("btn btn-sm btn-primary cursor-pointer", uploading && "pointer-events-none opacity-60")}>
            {uploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
            Görsel yükle
          </label>
          <div className="flex items-end gap-2">
            <div>
              <label htmlFor="p-path" className="field-label">
                veya mevcut görsel yolu
              </label>
              <input id="p-path" className="field-input !min-h-9 !py-1.5 text-sm" placeholder="/images/products/…webp" value={pathInput} onChange={(event) => setPathInput(event.target.value)} />
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => {
                if (!pathInput.startsWith("/images/") && !pathInput.startsWith("/media/")) return;
                set("images", [...product.images, { url: pathInput.trim(), alt: product.name || "Ürün görseli", isPlaceholder: false, fit: "contain", kind: "PACKSHOT" }]);
                setPathInput("");
              }}
            >
              Ekle
            </button>
          </div>
          <p className="text-xs text-cocoa-500">JPG, PNG, WebP veya AVIF · en fazla 5 MB. Görseller WebP biçimine dönüştürülür, meta verileri silinir.</p>
        </div>
        {uploadError ? <p className="field-error">{uploadError}</p> : null}
      </Section>

      <Section title="Varyantlar, fiyat ve stok" description="Fiyatlar KDV dahil satış fiyatıdır (ör. 2000 veya 2.000,00). “Önceki fiyat” yalnızca gerçek bir indirimde girilmelidir.">
        <div className="space-y-4">
          {product.variants.map((variant, index) => (
            <fieldset key={variant.key} className="rounded-xl border border-cocoa-800/10 p-4">
              <legend className="px-1 text-sm font-bold text-cocoa-700">Varyant {index + 1}</legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ["name", "Ad (ör. 10 kg Kova)"],
                    ["sku", "Stok kodu (SKU)"],
                    ["price", "Fiyat (₺, KDV dahil)"],
                    ["compareAtPrice", "Önceki fiyat (isteğe bağlı)"],
                    ["netWeightGrams", "Net miktar (gram)"],
                    ["unitsPerCase", "Koli içi adet"],
                    ["minOrderQty", "En az sipariş"],
                    ["maxOrderQty", "En çok sipariş"],
                    ["lowStockThreshold", "Kritik stok eşiği"],
                    ["servingGrams", "Doğrulanmış porsiyon (g)"],
                  ] as Array<[keyof EditorVariant, string]>
                ).map(([key, label]) => (
                  <div key={key}>
                    <label htmlFor={`v-${variant.key}-${key}`} className="field-label">
                      {label}
                    </label>
                    <input
                      id={`v-${variant.key}-${key}`}
                      className="field-input !min-h-10 !py-1.5 text-sm"
                      value={String(variant[key] ?? "")}
                      inputMode={["price", "compareAtPrice"].includes(key) ? "decimal" : ["name", "sku"].includes(key) ? undefined : "numeric"}
                      onChange={(event) => setVariant(variant.key, { [key]: event.target.value } as Partial<EditorVariant>)}
                    />
                  </div>
                ))}
                <div>
                  <label htmlFor={`v-${variant.key}-pkg`} className="field-label">
                    Ambalaj
                  </label>
                  <select id={`v-${variant.key}-pkg`} className="field-input !min-h-10 !py-1.5 text-sm" value={variant.packageType} onChange={(event) => setVariant(variant.key, { packageType: event.target.value })}>
                    {PACKAGE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {PACKAGE_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`v-${variant.key}-vat`} className="field-label">
                    KDV oranı (%)
                  </label>
                  <select id={`v-${variant.key}-vat`} className="field-input !min-h-10 !py-1.5 text-sm" value={variant.vatRate} onChange={(event) => setVariant(variant.key, { vatRate: event.target.value })}>
                    {["0", "1", "10", "20"].map((rate) => (
                      <option key={rate} value={rate}>
                        %{rate}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="field-label">Stok</p>
                  {variant.id ? (
                    <p className="flex min-h-10 items-center text-sm">
                      {variant.trackStock ? `${variant.stock ?? 0} adet` : "Takip kapalı"} ·{" "}
                      <Link href="/yonetim/stok" className="ml-1 text-bordeaux-600 underline">
                        stok yönetimi
                      </Link>
                    </p>
                  ) : (
                    <input
                      aria-label="Başlangıç stoğu"
                      className="field-input !min-h-10 !py-1.5 text-sm"
                      inputMode="numeric"
                      value={variant.initialStock}
                      onChange={(event) => setVariant(variant.key, { initialStock: event.target.value })}
                    />
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="checkbox !mt-0" checked={variant.trackStock} onChange={(event) => setVariant(variant.key, { trackStock: event.target.checked })} /> Stok takibi
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="checkbox !mt-0" checked={variant.isActive} onChange={(event) => setVariant(variant.key, { isActive: event.target.checked })} /> Aktif
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    className="radio"
                    name="defaultVariant"
                    checked={variant.isDefault}
                    onChange={() => set("variants", product.variants.map((v) => ({ ...v, isDefault: v.key === variant.key })))}
                  />{" "}
                  Varsayılan
                </label>
                {product.variants.length > 1 ? (
                  <button type="button" onClick={() => set("variants", product.variants.filter((v) => v.key !== variant.key))} className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-bordeaux-600">
                    <Trash2 className="size-3.5" aria-hidden="true" /> Varyantı kaldır
                  </button>
                ) : null}
              </div>
            </fieldset>
          ))}
          <button type="button" onClick={() => set("variants", [...product.variants, newVariant()])} className="inline-flex items-center gap-2 text-sm font-bold text-bordeaux-600">
            <Plus className="size-4" aria-hidden="true" /> Varyant ekle
          </button>
          <p className="text-xs text-cocoa-500">
            “Doğrulanmış porsiyon” girilirse porsiyon hesaplayıcıda öneri olarak gösterilir. Emin olmadığınız değeri girmeyin; boş bırakıldığında kullanıcı kendi ölçüsünü girer.
          </p>
        </div>
      </Section>

      <Section title="Açıklamalar">
        <div className="grid gap-4">
          {textarea("shortDescription", "Kısa açıklama (kartlar ve arama sonuçları)", 2)}
          {textarea("description", "Ürün açıklaması", 6, "Paragrafları boş satırla ayırın.")}
        </div>
      </Section>

      <Section title="Gıda bilgileri" description="Bilmediğiniz bilgiyi tahminle doldurmayın; boş bırakılan alanlar vitrinde “henüz eklenmedi” olarak görünür.">
        <div className="grid gap-4 md:grid-cols-2">
          {textarea("ingredients", "İçindekiler", 4, undefined, "md:col-span-2")}
          {textarea("allergens", "Alerjen bilgisi", 3)}
          {textarea("mayContain", "Eser miktarda içerebilir", 3)}
          {textarea("storageConditions", "Saklama koşulları", 2)}
          {input("shelfLife", "Raf ömrü")}
          {input("originInfo", "Menşei / üretim yeri")}
          {input("servingInfo", "Porsiyon bilgisi")}
          {textarea("usageAreasText", "Kullanım alanları", 2)}
          {textarea("usageTips", "Hazırlama / uygulama önerileri", 3)}
        </div>
      </Section>

      {product.kind === "KIT" ? (
        <Section title="Kit içeriği" description="Her satıra bir kalem / adım yazın.">
          <div className="grid gap-4 md:grid-cols-2">
            {textarea("kitContents", "Kutu içeriği", 6)}
            {textarea("kitPreparation", "Hazırlanış adımları", 6)}
          </div>
        </Section>
      ) : null}

      <Section title="Birlikte iyi gider" description="Ürün sayfasında ve sepete ekleme penceresinde önerilir. Seçim yapılmazsa uygun ürünler otomatik önerilir.">
        <input className="field-input mb-3 max-w-sm" placeholder="Ürün ara…" value={relatedQuery} onChange={(event) => setRelatedQuery(event.target.value)} aria-label="Ürün ara" />
        <div className="grid max-h-72 gap-1.5 overflow-y-auto rounded-xl border border-cocoa-800/10 p-3 sm:grid-cols-2">
          {relatedOptions.map((option) => (
            <label key={option.id} className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" className="checkbox !mt-0" checked={product.relatedIds.includes(option.id)} onChange={() => set("relatedIds", toggle(product.relatedIds, option.id))} />
              {option.name}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Arama motoru (SEO)">
        <div className="grid gap-4">
          {input("seoTitle", `Başlık (${product.seoTitle.length}/70)`, { maxLength: 70, placeholder: product.name })}
          {textarea("seoDescription", `Açıklama (${product.seoDescription.length}/170)`, 2)}
          <div className="rounded-xl bg-cream-100 p-4 text-sm">
            <p className="text-[#1a0dab]">{product.seoTitle || product.name} | ByMaster</p>
            <p className="text-xs text-[#006621]">…/urun/{slugify(product.slug || product.name)}</p>
            <p className="mt-1 text-cocoa-600">{product.seoDescription || product.shortDescription || "Açıklama eklenmedi."}</p>
          </div>
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cocoa-800/10 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="truncate text-sm text-cocoa-600">{product.name || "Yeni ürün"}</p>
          <div className="flex items-center gap-2">
            {publicUrl ? (
              <Link href={publicUrl} target="_blank" className="btn btn-sm btn-outline">
                Vitrinde gör <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            ) : null}
            <SaveButton />
          </div>
        </div>
      </div>
    </form>
  );
}

/** useFormStatus yalnızca form içindeki bir bileşende çalışır */
function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-sm btn-primary">
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      {pending ? "Kaydediliyor…" : "Kaydet"}
    </button>
  );
}
