import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Users } from "lucide-react";
import { AddAllToCart } from "@/components/blog/AddAllToCart";
import { InlineProduct } from "@/components/blog/InlineProduct";
import { PostGrid } from "@/components/blog/PostList";
import { Markdown } from "@/components/content/Markdown";
import { MiniProductRow } from "@/components/product/MiniProductRow";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { getPost, getRelatedPosts, splitContent } from "@/lib/blog";
import { getProductsBySlugs } from "@/lib/catalog";
import { BLOG_POST_TYPE_LABELS } from "@/lib/constants";
import { articleJsonLd, pageMetadata, recipeJsonLd } from "@/lib/seo";
import { formatDate, lines } from "@/lib/text";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Yazı bulunamadı" };
  return pageMetadata({
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    path: `/tarifler/${post.slug}`,
    image: post.coverImageUrl,
    imageAlt: post.coverImageAlt ?? post.title,
    type: "article",
    publishedTime: post.publishedAt?.toISOString(),
  });
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const blocks = splitContent(post.content);
  const embeddedSlugs = blocks.flatMap((block) => (block.type === "product" ? [block.slug] : []));
  const relatedSlugs = post.products.filter((p) => p.product.status === "ACTIVE").map((p) => p.product.slug);
  const [embedded, recipeProducts, related] = await Promise.all([
    getProductsBySlugs(Array.from(new Set(embeddedSlugs))),
    getProductsBySlugs(relatedSlugs),
    getRelatedPosts(post.id, post.categoryId, 3),
  ]);
  const embeddedBySlug = new Map(embedded.map((product) => [product.slug, product]));
  const notes = new Map(post.products.map((p) => [p.product.slug, p.note]));
  const purchasableVariantIds = recipeProducts
    .filter((product) => product.variant && (product.availability === "IN_STOCK" || product.availability === "LOW_STOCK"))
    .map((product) => product.variant!.id);
  const ingredients = lines(post.recipeIngredients);
  const steps = lines(post.recipeSteps);
  const isRecipe = post.type === "RECIPE" && (ingredients.length > 0 || steps.length > 0);

  return (
    <article className="pb-24">
      <JsonLd
        data={
          isRecipe
            ? recipeJsonLd({ ...post, category: post.category?.name ?? null })
            : articleJsonLd({ ...post })
        }
      />
      <header className="bg-cream-200">
        <div className="container-page pb-12 pt-8 lg:pb-16">
          <Breadcrumbs
            items={[
              { name: "Tarifler ve İlham", path: "/tarifler" },
              ...(post.category ? [{ name: post.category.name, path: `/tarifler/kategori/${post.category.slug}` }] : []),
              { name: post.title, path: `/tarifler/${post.slug}` },
            ]}
          />
          <div className="mx-auto mt-10 max-w-3xl text-center">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-caramel-700">
              {BLOG_POST_TYPE_LABELS[post.type]} {post.category ? `· ${post.category.name}` : ""}
            </p>
            <h1 className="display-lg mt-4 text-cocoa-900">{post.title}</h1>
            <p className="mt-5 text-lg leading-relaxed text-cocoa-600">{post.excerpt}</p>
            <p className="mt-6 text-sm text-cocoa-500">
              {post.authorName} · {post.publishedAt ? formatDate(post.publishedAt) : ""} · {post.readingMinutes} dk okuma
            </p>
          </div>
        </div>
      </header>

      {post.coverImageUrl ? (
        <figure className="container-page -mt-2">
          <div className="relative mx-auto aspect-[16/9] max-w-6xl overflow-hidden rounded-[1.8rem] bg-cream-300">
            <Image src={post.coverImageUrl} alt={post.coverImageAlt ?? ""} fill priority sizes="(min-width: 1280px) 72rem, 100vw" className="object-cover" />
          </div>
          {post.coverCredit ? <figcaption className="mx-auto mt-2 max-w-6xl text-right text-xs text-cocoa-400">{post.coverCredit}</figcaption> : null}
        </figure>
      ) : null}

      <div className="container-page mt-14 grid gap-12 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7 lg:col-start-2">
          {isRecipe ? (
            <section className="mb-12 rounded-[1.4rem] border border-cocoa-800/10 bg-cream-100 p-6 sm:p-8" aria-labelledby="tarif-karti">
              <h2 id="tarif-karti" className="font-display text-2xl text-cocoa-900">
                Tarif kartı
              </h2>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cocoa-600">
                {post.recipeYield ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" aria-hidden="true" /> {post.recipeYield}
                  </span>
                ) : null}
                {post.prepMinutes ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden="true" /> Hazırlık {post.prepMinutes} dk
                  </span>
                ) : null}
                {post.cookMinutes ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden="true" /> Pişirme {post.cookMinutes} dk
                  </span>
                ) : null}
              </div>
              <div className="mt-6 grid gap-8 md:grid-cols-2">
                {ingredients.length ? (
                  <div>
                    <p className="eyebrow mb-3">Malzemeler</p>
                    <ul className="list-disc space-y-1.5 pl-5 text-[0.95rem] text-cocoa-800 marker:text-caramel-600">
                      {ingredients.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {steps.length ? (
                  <div>
                    <p className="eyebrow mb-3">Hazırlanışı</p>
                    <ol className="list-decimal space-y-1.5 pl-5 text-[0.95rem] text-cocoa-800 marker:font-bold marker:text-caramel-700">
                      {steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {blocks.map((block, index) => {
            if (block.type === "markdown") return <Markdown key={index} content={block.content} />;
            const product = embeddedBySlug.get(block.slug);
            return product ? <InlineProduct key={index} product={product} /> : null;
          })}

          {post.tags.length ? (
            <ul className="mt-12 flex flex-wrap gap-2 border-t border-cocoa-800/10 pt-6">
              {post.tags.map(({ tag }) => (
                <li key={tag.slug} className="rounded-full bg-cream-200 px-3 py-1 text-xs font-bold text-cocoa-600">
                  #{tag.name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {recipeProducts.length > 0 ? (
          <aside className="lg:col-span-3 lg:col-start-10" aria-labelledby="tarif-urunleri">
            <div className="space-y-5 rounded-[1.4rem] bg-cocoa-900 p-6 text-cream-100 lg:sticky lg:top-28">
              <div>
                <p className="eyebrow eyebrow-light">Tariften sepete</p>
                <h2 id="tarif-urunleri" className="mt-2 font-display text-2xl text-cream-50">
                  {isRecipe ? "Bu tarifte kullanılan ürünler" : "Yazıda geçen ürünler"}
                </h2>
              </div>
              <ul className="divide-y divide-cream-50/10 rounded-xl bg-cream-50 px-3 text-ink">
                {recipeProducts.map((product) => (
                  <li key={product.id} className="py-3">
                    <MiniProductRow product={product} note={notes.get(product.slug) ?? null} />
                  </li>
                ))}
              </ul>
              <AddAllToCart variantIds={purchasableVariantIds} count={purchasableVariantIds.length} />
            </div>
          </aside>
        ) : null}
      </div>

      {related.length > 0 ? (
        <section className="container-page mt-24" aria-labelledby="diger-yazilar">
          <div className="flex items-end justify-between border-b border-cocoa-800/15 pb-6">
            <h2 id="diger-yazilar" className="display-md text-cocoa-900">
              Okumaya devam edin
            </h2>
            <Link href="/tarifler" className="text-sm font-bold text-cocoa-800 link-underline">
              Tüm yazılar
            </Link>
          </div>
          <div className="mt-10">
            <PostGrid posts={related} />
          </div>
        </section>
      ) : null}
    </article>
  );
}
