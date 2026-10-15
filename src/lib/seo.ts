import "server-only";
import type { Metadata } from "next";
import { absoluteUrl, appUrl } from "@/lib/env";
import { kurusToDecimalString } from "@/lib/money";
import { lines } from "@/lib/text";
import type { Availability } from "@/lib/availability";

export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  noindex?: boolean;
  publishedTime?: string;
  absoluteTitle?: boolean;
}): Metadata {
  const url = absoluteUrl(input.path);
  const image = input.image ?? "/images/og-default.jpg";
  const images = [{ url: image.startsWith("http") ? image : absoluteUrl(image), alt: input.imageAlt ?? input.title }];
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: input.type ?? "website",
      locale: "tr_TR",
      siteName: "ByMaster",
      images,
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: input.title, description: input.description, images: images.map((i) => i.url) },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export function organizationJsonLd(settings: {
  storeName: string;
  companyLegalName: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  instagramUrl: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.storeName,
    ...(settings.companyLegalName ? { legalName: settings.companyLegalName } : {}),
    url: appUrl,
    logo: absoluteUrl("/brand/icon-512.png"),
    ...(settings.instagramUrl ? { sameAs: [settings.instagramUrl] } : {}),
    ...(settings.companyPhone || settings.companyEmail
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            areaServed: "TR",
            availableLanguage: "Turkish",
            ...(settings.companyPhone ? { telephone: settings.companyPhone } : {}),
            ...(settings.companyEmail ? { email: settings.companyEmail } : {}),
          },
        }
      : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ByMaster",
    url: appUrl,
    inLanguage: "tr-TR",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${appUrl}/arama?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

const AVAILABILITY_SCHEMA: Record<Availability, string> = {
  IN_STOCK: "https://schema.org/InStock",
  LOW_STOCK: "https://schema.org/LimitedAvailability",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
  COMING_SOON: "https://schema.org/PreOrder",
};

export function productJsonLd(product: {
  name: string;
  slug: string;
  description: string;
  brand: string | null;
  images: string[];
  category: string;
  variants: Array<{ sku: string; priceKurus: number; availability: Availability; netWeightGrams: number | null }>;
}) {
  const offers = product.variants
    .filter((variant) => variant.priceKurus > 0 && variant.availability !== "COMING_SOON")
    .map((variant) => ({
      "@type": "Offer",
      sku: variant.sku,
      price: kurusToDecimalString(variant.priceKurus),
      priceCurrency: "TRY",
      availability: AVAILABILITY_SCHEMA[variant.availability],
      url: absoluteUrl(`/urun/${product.slug}`),
      itemCondition: "https://schema.org/NewCondition",
    }));
  const first = product.variants[0];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: first?.sku,
    category: product.category,
    image: product.images.map((image) => absoluteUrl(image)),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(first?.netWeightGrams ? { weight: { "@type": "QuantitativeValue", value: first.netWeightGrams / 1000, unitCode: "KGM" } } : {}),
    ...(offers.length === 1 ? { offers: offers[0] } : offers.length > 1 ? { offers } : {}),
  };
}

export function articleJsonLd(post: {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  authorName: string;
  publishedAt: Date | null;
  updatedAt: Date;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    mainEntityOfPage: absoluteUrl(`/tarifler/${post.slug}`),
    ...(post.coverImageUrl ? { image: [absoluteUrl(post.coverImageUrl)] } : {}),
    author: { "@type": "Organization", name: post.authorName },
    publisher: { "@type": "Organization", name: "ByMaster", logo: { "@type": "ImageObject", url: absoluteUrl("/brand/icon-512.png") } },
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: "tr-TR",
  };
}

export function recipeJsonLd(post: {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  authorName: string;
  publishedAt: Date | null;
  recipeYield: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  recipeIngredients: string | null;
  recipeSteps: string | null;
  category: string | null;
}) {
  const minutes = (value: number | null) => (value ? `PT${value}M` : undefined);
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: post.title,
    description: post.excerpt,
    ...(post.coverImageUrl ? { image: [absoluteUrl(post.coverImageUrl)] } : {}),
    author: { "@type": "Organization", name: post.authorName },
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    ...(post.recipeYield ? { recipeYield: post.recipeYield } : {}),
    ...(post.prepMinutes ? { prepTime: minutes(post.prepMinutes) } : {}),
    ...(post.cookMinutes ? { cookTime: minutes(post.cookMinutes) } : {}),
    ...(post.category ? { recipeCategory: post.category } : {}),
    recipeCuisine: "Tatlı",
    recipeIngredient: lines(post.recipeIngredients),
    recipeInstructions: lines(post.recipeSteps).map((text, index) => ({ "@type": "HowToStep", position: index + 1, text })),
    inLanguage: "tr-TR",
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
