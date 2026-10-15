import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { deletePageAction } from "@/app/actions/admin/content";
import { ConfirmButton } from "@/components/admin/AdminForm";
import { PageEditor } from "@/components/admin/PageEditor";
import { AdminHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { ORDER_PLACEHOLDER_VARS, sellerVars, shippingVars } from "@/lib/legal";
import { getSettings, SYSTEM_PAGE_SLUGS } from "@/lib/settings";

export const metadata = { title: "Sayfayı düzenle" };

export default async function EditCmsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [page, settings] = await Promise.all([db.page.findUnique({ where: { id } }), getSettings()]);
  if (!page) notFound();
  const isSystem = SYSTEM_PAGE_SLUGS.includes(page.slug);
  const publicPath = page.slug === "hakkimizda" ? "/hakkimizda" : `/sayfa/${page.slug}`;
  return (
    <div>
      <AdminHeader
        back={{ href: "/yonetim/sayfalar", label: "Sayfalar" }}
        title={page.title}
        actions={
          <>
            {page.status === "PUBLISHED" ? (
              <Link href={publicPath} target="_blank" className="btn btn-sm btn-outline">
                Sitede gör <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
            {isSystem ? null : <ConfirmButton action={deletePageAction} fields={{ id: page.id }} label="Sil" confirmText="Sayfa kalıcı olarak silinecek. Emin misiniz?" />}
          </>
        }
      />
      <PageEditor
        lockedSlug={isSystem}
        vars={{ ...ORDER_PLACEHOLDER_VARS, ...sellerVars(settings, appUrl), ...shippingVars(settings) }}
        initial={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          kind: page.kind as "INFO" | "LEGAL",
          content: page.content,
          status: page.status as "DRAFT" | "PUBLISHED",
          seoTitle: page.seoTitle ?? "",
          seoDescription: page.seoDescription ?? "",
        }}
      />
    </div>
  );
}
