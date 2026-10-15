import { PostEditor } from "@/components/admin/PostEditor";
import { AdminHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Yeni yazı" };

export default async function NewPostPage() {
  const admin = await requireAdmin();
  const [categories, products] = await Promise.all([
    db.blogCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  return (
    <div>
      <AdminHeader back={{ href: "/yonetim/blog", label: "Blog ve tarifler" }} title="Yeni yazı" />
      <PostEditor
        categories={categories}
        products={products}
        initial={{
          title: "",
          slug: "",
          type: "ARTICLE",
          categoryId: categories[0]?.id ?? "",
          tags: "",
          excerpt: "",
          content: "",
          coverImageUrl: "",
          coverImageAlt: "",
          coverCredit: "",
          authorName: admin.name,
          status: "DRAFT",
          publishedAt: "",
          seoTitle: "",
          seoDescription: "",
          recipeYield: "",
          prepMinutes: "",
          cookMinutes: "",
          recipeIngredients: "",
          recipeSteps: "",
          products: [],
        }}
      />
    </div>
  );
}
