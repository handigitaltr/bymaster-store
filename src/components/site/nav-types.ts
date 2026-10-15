export type NavCategory = { slug: string; name: string; count: number };
export type NavGroup = { title: string; categories: NavCategory[] };
export type NavData = {
  groups: NavGroup[];
  feature: { title: string; href: string; imageUrl: string; imageAlt: string; caption: string } | null;
};

export const MAIN_LINKS = [
  { href: "/lezzet-dunyasi", label: "Waffle & Tatlı Dünyası" },
  { href: "/tarifler", label: "Tarifler ve İlham" },
  { href: "/profesyonel", label: "Profesyonellere Özel" },
  { href: "/hakkimizda", label: "Hakkımızda" },
] as const;
