import { db } from "@/lib/db";
import { ACTIVE_PRODUCT, getActiveCategories } from "@/lib/catalog";
import { HeaderBar } from "./HeaderBar";
import type { NavData, NavGroup } from "./nav-types";

const GROUP_ORDER = ["Soslar", "Süslemeler", "Karışımlar ve Kitler"];

export async function SiteHeader() {
  const categories = await getActiveCategories();
  const groups = new Map<string, NavGroup>();
  for (const category of categories) {
    if (category._count.products === 0) continue;
    const title = category.menuGroup ?? "Diğer";
    if (!groups.has(title)) groups.set(title, { title, categories: [] });
    groups.get(title)!.categories.push({ slug: category.slug, name: category.shortName ?? category.name, count: category._count.products });
  }
  const orderedGroups = Array.from(groups.values()).sort(
    (a, b) => (GROUP_ORDER.indexOf(a.title) + 99) % 99 - (GROUP_ORDER.indexOf(b.title) + 99) % 99,
  );

  const featured = await db.product.findFirst({
    where: { ...ACTIVE_PRODUCT, isFeatured: true, saleStatus: "AVAILABLE", images: { some: { isPlaceholder: false } } },
    orderBy: { sortOrder: "asc" },
    select: {
      slug: true,
      name: true,
      subtitle: true,
      images: { where: { isPlaceholder: false }, orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
    },
  });

  const nav: NavData = {
    groups: orderedGroups,
    feature:
      featured && featured.images[0]
        ? {
            title: featured.name.replace(/^ByMaster\s+/, ""),
            href: `/urun/${featured.slug}`,
            imageUrl: featured.images[0].url,
            imageAlt: featured.images[0].alt,
            caption: featured.subtitle ?? "",
          }
        : null,
  };
  return <HeaderBar nav={nav} />;
}
