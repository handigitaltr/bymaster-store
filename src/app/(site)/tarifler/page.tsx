import type { Metadata } from "next";
import Link from "next/link";
import { CategoryTabs, LeadPost, PostGrid } from "@/components/blog/PostList";
import { getBlogCategories, listPosts } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: "Tarifler ve İlham — ByMaster Lezzet Günlüğü",
  description:
    "Evde waffle, pankek ve churros rehberleri; waffle sosları, krep kırıkları ve pirinç patlaklarıyla sunum fikirleri; kafe menüsü için maliyet ve porsiyon planlaması.",
  path: "/tarifler",
  image: "/images/editorial/waffle-cilek.jpg",
});

export default async function JournalIndexPage() {
  const [{ posts }, categories] = await Promise.all([listPosts({ take: 30 }), getBlogCategories()]);
  const [lead, ...rest] = posts;
  return (
    <div className="pb-24">
      <section className="bg-cream-200">
        <div className="container-page py-14 lg:py-20">
          <p className="eyebrow">Tarifler · Sunum · Rehberler</p>
          <h1 className="display-xl mt-4 max-w-4xl text-cocoa-900">
            ByMaster <span className="italic text-bordeaux-600">Lezzet Günlüğü</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-cocoa-600">
            Mutfak tezgâhından kafe vitrinine: tarifler, sunum fikirleri ve profesyonel mutfak için pratik rehberler.
          </p>
          <div className="mt-10">
            <CategoryTabs categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c._count.posts }))} active={null} />
          </div>
        </div>
      </section>
      <div className="container-page mt-14 space-y-20">
        {lead ? <LeadPost post={lead} /> : <p className="text-cocoa-600">Henüz yayımlanmış yazı yok.</p>}
        {rest.length > 0 ? (
          <>
            <div className="rule" />
            <PostGrid posts={rest} />
          </>
        ) : null}
        <p className="text-center text-sm text-cocoa-500">
          Ürünleri keşfetmek için{" "}
          <Link href="/urunler" className="font-bold text-bordeaux-600 underline">
            kataloğa göz atın
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
