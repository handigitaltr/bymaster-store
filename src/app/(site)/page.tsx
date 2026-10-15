import type { Metadata } from "next";
import { CategoryMosaic } from "@/components/home/CategoryMosaic";
import { Hero } from "@/components/home/Hero";
import { Journal } from "@/components/home/Journal";
import { KitShowcase, type KitItem } from "@/components/home/KitShowcase";
import { Manifesto } from "@/components/home/Manifesto";
import { ProSection } from "@/components/home/ProSection";
import { TrustStrip } from "@/components/home/TrustStrip";
import { UsageStories, type UsageStory } from "@/components/home/UsageStories";
import { ProductRail } from "@/components/product/ProductRail";
import { JsonLd } from "@/components/ui/JsonLd";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { variantAvailability, isPurchasable } from "@/lib/availability";
import {
  ACTIVE_PRODUCT,
  getActiveCategories,
  getCatalogFacts,
  getFeaturedProducts,
  getPackagingSummary,
  getProductsBySlugs,
} from "@/lib/catalog";
import { db } from "@/lib/db";
import { organizationJsonLd, pageMetadata, websiteJsonLd } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { formatPhoneForDisplay, lines } from "@/lib/text";

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: "ByMaster — Profesyonel Pastacılık Ürünleri",
  description:
    "Waffle sosları, Premium Çikolata Bazı, pirinç patlakları, krep kırıkları, waffle mix ve evde tatlı kitleri. Kafeler, pastaneler ve ev mutfakları için ByMaster.",
  path: "/",
  image: "/images/editorial/hero-waffle.jpg",
  absoluteTitle: true,
});

async function getKits(): Promise<KitItem[]> {
  const kits = await db.product.findMany({
    where: { ...ACTIVE_PRODUCT, kind: "KIT" },
    orderBy: [{ saleStatus: "asc" }, { sortOrder: "asc" }],
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { where: { isActive: true }, orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }], take: 1 },
    },
  });
  return kits.map((kit) => {
    const variant = kit.variants[0];
    const availability = variant ? variantAvailability(variant, kit.saleStatus) : "OUT_OF_STOCK";
    return {
      slug: kit.slug,
      name: kit.name,
      subtitle: kit.subtitle,
      description: kit.shortDescription,
      imageUrl: kit.images[0]?.url ?? null,
      imageAlt: kit.images[0]?.alt ?? kit.name,
      contents: lines(kit.kitContents),
      preparation: lines(kit.kitPreparation),
      allergens: kit.allergens,
      servingInfo: kit.servingInfo,
      priceKurus: variant && variant.priceKurus > 0 ? variant.priceKurus : null,
      variantId: variant?.id ?? null,
      available: isPurchasable(availability) && Boolean(variant && variant.priceKurus > 0),
      comingSoon: kit.saleStatus === "COMING_SOON",
      freeShipping: kit.freeShipping,
    };
  });
}

export default async function HomePage() {
  const [facts, categories, featured, packaging, kits, posts, settings, spotlightProduct, storyProducts] = await Promise.all([
    getCatalogFacts(),
    getActiveCategories(),
    getFeaturedProducts(12),
    getPackagingSummary(),
    getKits(),
    db.blogPost.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        type: true,
        coverImageUrl: true,
        coverImageAlt: true,
        readingMinutes: true,
        publishedAt: true,
        category: { select: { name: true, slug: true } },
      },
    }),
    getSettings(),
    getProductsBySlugs(["antep-fistikli-waffle-sosu-10-kg"]),
    getProductsBySlugs([
      "sutlu-waffle-sosu-10-kg",
      "waffle-mix-1-kg",
      "pirinc-patlagi-metalik-karisik-1-kg",
      "lotus-waffle-sosu-10-kg",
      "frambuazli-waffle-sosu-10-kg",
      "krep-kirigi-cilek-2-5-kg",
      "churros-box",
      "bitter-waffle-sosu-10-kg",
      "beyaz-waffle-sosu-10-kg",
    ]),
  ]);

  const bySlug = new Map(storyProducts.map((product) => [product.slug, product]));
  const pick = (...slugs: string[]) => slugs.map((slug) => bySlug.get(slug)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  const stories: UsageStory[] = [
    {
      number: "01",
      title: "Waffle ve pankek sunumları",
      text: "Sıcak waffle'ın üzerinde parlayan sos, ardından servis anında eklenen çıtır süslemeler: klasik bir tabağı vitrin ürününe dönüştüren katmanlar.",
      image: "/images/editorial/sunum-waffle.jpg",
      imageAlt: "Dondurma ve meyvelerle servis edilen waffle",
      href: "/urunler?kullanim=waffle",
      products: pick("sutlu-waffle-sosu-10-kg", "waffle-mix-1-kg", "pirinc-patlagi-metalik-karisik-1-kg"),
    },
    {
      number: "02",
      title: "Krep, dondurma ve tatlı tabakları",
      text: "İnce bir çizgi hâlinde gezdirilen sos ve kontrast bir süsleme, krep ve dondurma sunumlarında hem lezzeti hem görüntüyü tamamlar.",
      image: "/images/editorial/sunum-krep.jpg",
      imageAlt: "Krema ve çikolata sosuyla servis edilen krep",
      href: "/urunler?kullanim=krep",
      products: pick("lotus-waffle-sosu-10-kg", "frambuazli-waffle-sosu-10-kg", "krep-kirigi-cilek-2-5-kg"),
    },
    {
      number: "03",
      title: "Churros ve paylaşmalık tatlılar",
      text: "Ortaya konan bir tabak churros ve yanında farklı dip sosları: paylaşımlı sunumlarda tercih özgürlüğü tanıyan keyifli bir kurgu.",
      image: "/images/editorial/sunum-churros.jpg",
      imageAlt: "Sıcak çikolata eşliğinde churros tabağı",
      href: "/urunler?kullanim=churros",
      products: pick("churros-box", "bitter-waffle-sosu-10-kg", "beyaz-waffle-sosu-10-kg"),
    },
  ];

  const spotlight = spotlightProduct[0]?.image && spotlightProduct[0].variant
    ? {
        slug: spotlightProduct[0].slug,
        name: spotlightProduct[0].name,
        subtitle: spotlightProduct[0].subtitle,
        imageUrl: spotlightProduct[0].image.url,
        priceKurus: spotlightProduct[0].variant.priceKurus,
      }
    : null;

  const contactBits = [
    settings.companyPhone ? formatPhoneForDisplay(settings.companyPhone) : null,
    settings.companyEmail,
  ].filter(Boolean);
  const supportLine = contactBits.length
    ? `Sorularınız için ${contactBits.join(" · ")} veya iletişim formu.`
    : "Sorularınız için iletişim formumuzdan bize yazabilirsiniz.";
  const formats = packaging.length
    ? `${Array.from(new Set(packaging.map((row) => row.format.split(" · ")[0]))).join(", ")} seçenekleri.`
    : "Profesyonel kullanıma uygun ambalajlar.";

  return (
    <>
      <JsonLd data={organizationJsonLd(settings)} />
      <JsonLd data={websiteJsonLd()} />
      <Hero facts={facts} spotlight={spotlight} />
      <CategoryMosaic
        categories={categories.map((category) => ({
          slug: category.slug,
          name: category.name,
          description: category.description,
          imageUrl: category.imageUrl,
          imageAlt: category.imageAlt,
          accentColor: category.accentColor,
          count: category._count.products,
        }))}
      />
      <section className="bg-cream-50 pb-24" aria-labelledby="one-cikanlar">
        <div className="container-page">
          <SectionHeader
            eyebrow="Seçki"
            title={<span id="one-cikanlar">Öne Çıkanlar</span>}
            description="Profesyonel kovalardaki waffle soslarından evde tatlı kitlerine, kataloğumuzdan seçtiklerimiz."
            action={{ href: "/urunler", label: "Tüm ürünler" }}
          />
          <div className="mt-10">
            <ProductRail products={featured} label="Öne çıkan ürünler" />
          </div>
        </div>
      </section>
      <UsageStories stories={stories} />
      <ProSection rows={packaging} />
      <KitShowcase kits={kits} />
      <Manifesto />
      <Journal posts={posts} />
      <TrustStrip productCount={facts.productCount} categoryCount={facts.categoryCount} formats={formats} supportLine={supportLine} />
    </>
  );
}
