import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BLOG_POST_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/text";
import { cx } from "@/lib/utils";

export type PostSummary = {
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

function Meta({ post }: { post: PostSummary }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-caramel-700">
      <span>{post.category?.name ?? BLOG_POST_TYPE_LABELS[post.type]}</span>
      <span aria-hidden="true" className="text-cocoa-300">
        /
      </span>
      <span className="text-cocoa-500">{post.readingMinutes} dk okuma</span>
      {post.publishedAt ? (
        <>
          <span aria-hidden="true" className="text-cocoa-300">
            /
          </span>
          <span className="text-cocoa-500">{formatDate(post.publishedAt)}</span>
        </>
      ) : null}
    </p>
  );
}

export function LeadPost({ post }: { post: PostSummary }) {
  return (
    <article className="group grid gap-8 lg:grid-cols-12 lg:items-center">
      <Link href={`/tarifler/${post.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-cream-300 lg:col-span-7" tabIndex={-1} aria-hidden="true">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? ""}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 92vw"
            className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
          />
        ) : null}
      </Link>
      <div className="lg:col-span-5">
        <Meta post={post} />
        <h2 className="mt-4 font-display text-[2.2rem] leading-[1.08] tracking-[-0.02em] text-cocoa-900 md:text-[2.7rem]">
          <Link href={`/tarifler/${post.slug}`} className="link-reveal">
            {post.title}
          </Link>
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-cocoa-600">{post.excerpt}</p>
        <Link href={`/tarifler/${post.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-bordeaux-600">
          Devamını oku <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

const SPANS = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];
const RATIOS = ["aspect-[16/10]", "aspect-[4/5]", "aspect-[4/5]", "aspect-[16/10]"];

export function PostGrid({ posts }: { posts: PostSummary[] }) {
  return (
    <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-12">
      {posts.map((post, index) => (
        <article key={post.slug} className={cx("group", SPANS[index % SPANS.length])}>
          <Link href={`/tarifler/${post.slug}`} className={cx("relative block overflow-hidden rounded-[1.4rem] bg-cream-300", RATIOS[index % RATIOS.length])} tabIndex={-1} aria-hidden="true">
            {post.coverImageUrl ? (
              <Image
                src={post.coverImageUrl}
                alt={post.coverImageAlt ?? ""}
                fill
                sizes="(min-width: 1024px) 45vw, (min-width: 640px) 46vw, 92vw"
                className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03]"
              />
            ) : null}
          </Link>
          <div className="mt-5">
            <Meta post={post} />
            <h3 className="mt-2.5 font-display text-2xl leading-snug text-cocoa-900">
              <Link href={`/tarifler/${post.slug}`} className="link-reveal">
                {post.title}
              </Link>
            </h3>
            <p className="mt-2 line-clamp-3 text-[0.95rem] leading-relaxed text-cocoa-600">{post.excerpt}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function CategoryTabs({ categories, active }: { categories: Array<{ slug: string; name: string; count: number }>; active: string | null }) {
  return (
    <nav aria-label="Yazı kategorileri" className="scrollbar-none relative -mx-4 flex gap-2 overflow-x-auto px-4">
      <Link
        href="/tarifler"
        aria-current={active === null ? "page" : undefined}
        className={cx(
          "flex-none rounded-full px-4 py-2 text-sm font-bold transition",
          active === null ? "bg-cocoa-800 text-cream-50" : "border border-cocoa-800/15 text-cocoa-700 hover:border-cocoa-800/40",
        )}
      >
        Tümü
      </Link>
      {categories
        .filter((category) => category.count > 0)
        .map((category) => (
          <Link
            key={category.slug}
            href={`/tarifler/kategori/${category.slug}`}
            aria-current={active === category.slug ? "page" : undefined}
            className={cx(
              "flex-none rounded-full px-4 py-2 text-sm font-bold transition",
              active === category.slug ? "bg-cocoa-800 text-cream-50" : "border border-cocoa-800/15 text-cocoa-700 hover:border-cocoa-800/40",
            )}
          >
            {category.name} <span className="ml-1 text-xs opacity-60">{category.count}</span>
          </Link>
        ))}
    </nav>
  );
}
