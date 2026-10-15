import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { deleteBlogPostAction } from "@/app/actions/admin/content";
import { ConfirmButton } from "@/components/admin/AdminForm";
import { PostEditor } from "@/components/admin/PostEditor";
import { AdminHeader } from "@/components/admin/ui";
import { Alert } from "@/components/ui/Alert";
import { toLocalDateTimeInput } from "@/lib/admin-form";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata = { title: "Yazıyı düzenle" };

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kaydedildi?: string }> }) {
  await requireAdmin();
  const [{ id }, { kaydedildi }] = await Promise.all([params, searchParams]);
  const [post, categories, products] = await Promise.all([
    db.blogPost.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } }, products: { orderBy: { sortOrder: "asc" } } },
    }),
    db.blogCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  if (!post) notFound();
  const isLive = post.status === "PUBLISHED" && post.publishedAt !== null && post.publishedAt <= new Date();

  return (
    <div>
      <AdminHeader
        back={{ href: "/yonetim/blog", label: "Blog ve tarifler" }}
        title={post.title}
        actions={
          <>
            {isLive ? (
              <Link href={`/tarifler/${post.slug}`} target="_blank" className="btn btn-sm btn-outline">
                Sitede gör <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
            <ConfirmButton action={deleteBlogPostAction} fields={{ id: post.id }} label="Sil" confirmText="Yazı kalıcı olarak silinecek. Emin misiniz?" />
          </>
        }
      />
      {kaydedildi ? (
        <div className="mb-6">
          <Alert tone="success">Yazı oluşturuldu.</Alert>
        </div>
      ) : null}
      <PostEditor
        categories={categories}
        products={products}
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          type: post.type as "ARTICLE" | "RECIPE" | "GUIDE",
          categoryId: post.categoryId ?? "",
          tags: post.tags.map((t) => t.tag.name).join(", "),
          excerpt: post.excerpt,
          content: post.content,
          coverImageUrl: post.coverImageUrl ?? "",
          coverImageAlt: post.coverImageAlt ?? "",
          coverCredit: post.coverCredit ?? "",
          authorName: post.authorName,
          status: post.status as "DRAFT" | "PUBLISHED",
          publishedAt: toLocalDateTimeInput(post.publishedAt),
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          recipeYield: post.recipeYield ?? "",
          prepMinutes: post.prepMinutes ? String(post.prepMinutes) : "",
          cookMinutes: post.cookMinutes ? String(post.cookMinutes) : "",
          recipeIngredients: post.recipeIngredients ?? "",
          recipeSteps: post.recipeSteps ?? "",
          products: post.products.map((p) => ({ productId: p.productId, note: p.note ?? "" })),
        }}
      />
    </div>
  );
}
