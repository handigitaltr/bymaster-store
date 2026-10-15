import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BLOG_POST_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/text";

export type JournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  type: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  readingMinutes: number;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
};

function Meta({ post }: { post: JournalPost }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-caramel-700">
      <span>{post.category?.name ?? BLOG_POST_TYPE_LABELS[post.type]}</span>
      <span aria-hidden="true" className="text-cocoa-300">
        /
      </span>
      <span className="text-cocoa-500">{post.readingMinutes} dk okuma</span>
    </p>
  );
}

export function Journal({ posts }: { posts: JournalPost[] }) {
  if (posts.length === 0) return null;
  const [lead, ...rest] = posts;
  return (
    <section className="bg-cream-50 py-20 lg:py-28" aria-labelledby="gunluk-baslik">
      <div className="container-page">
        <div className="flex flex-col gap-6 border-b border-cocoa-800/15 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-3">Tarifler · Sunum · Rehberler</p>
            <h2 id="gunluk-baslik" className="display-lg text-cocoa-900">
              ByMaster <span className="italic">Lezzet Günlüğü</span>
            </h2>
          </div>
          <Link href="/tarifler" className="group inline-flex items-center gap-2 text-sm font-bold text-cocoa-800">
            <span className="link-underline">Tüm yazılar</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <article className="group lg:col-span-7">
            {/* Görsel bağlantı başlık bağlantısının tekrarıdır; ekran okuyuculardan ve sekme sırasından gizlenir */}
            <Link href={`/tarifler/${lead.slug}`} className="block" tabIndex={-1} aria-hidden="true">
              <div className="relative aspect-[16/11] overflow-hidden rounded-[1.6rem] bg-cream-300">
                {lead.coverImageUrl ? (
                  <Image
                    src={lead.coverImageUrl}
                    alt={lead.coverImageAlt ?? ""}
                    fill
                    sizes="(min-width: 1024px) 55vw, 92vw"
                    className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
                  />
                ) : null}
              </div>
            </Link>
            <div className="mt-6 max-w-2xl">
              <Meta post={lead} />
              <h3 className="mt-3 font-display text-[2rem] leading-[1.1] text-cocoa-900">
                <Link href={`/tarifler/${lead.slug}`} className="link-reveal">
                  {lead.title}
                </Link>
              </h3>
              <p className="mt-3 text-base leading-relaxed text-cocoa-600">{lead.excerpt}</p>
              <Link href={`/tarifler/${lead.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-bordeaux-600">
                Devamını oku <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </article>

          <div className="lg:col-span-5">
            <ol className="divide-y divide-cocoa-800/12">
              {rest.map((post, index) => (
                <li key={post.slug} className="group py-6 first:pt-0">
                  <article className="grid grid-cols-[1fr_7.5rem] gap-5 sm:grid-cols-[1fr_9rem]">
                    <div>
                      <p className="font-display text-sm text-cocoa-400 tabular-nums">{String(index + 2).padStart(2, "0")}</p>
                      <Meta post={post} />
                      <h3 className="mt-2 font-display text-xl leading-snug text-cocoa-900">
                        <Link href={`/tarifler/${post.slug}`} className="link-reveal">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cocoa-600">{post.excerpt}</p>
                      {post.publishedAt ? <p className="mt-2 text-xs text-cocoa-400">{formatDate(post.publishedAt)}</p> : null}
                    </div>
                    <Link href={`/tarifler/${post.slug}`} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream-300" tabIndex={-1} aria-hidden="true">
                      {post.coverImageUrl ? (
                        <Image src={post.coverImageUrl} alt="" fill sizes="144px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : null}
                    </Link>
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
