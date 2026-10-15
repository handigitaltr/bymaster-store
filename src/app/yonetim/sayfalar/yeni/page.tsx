import { PageEditor } from "@/components/admin/PageEditor";
import { AdminHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { appUrl } from "@/lib/env";
import { ORDER_PLACEHOLDER_VARS, sellerVars, shippingVars } from "@/lib/legal";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Yeni sayfa" };

export default async function NewCmsPage() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <div>
      <AdminHeader back={{ href: "/yonetim/sayfalar", label: "Sayfalar" }} title="Yeni sayfa" />
      <PageEditor
        vars={{ ...ORDER_PLACEHOLDER_VARS, ...sellerVars(settings, appUrl), ...shippingVars(settings) }}
        initial={{ title: "", slug: "", kind: "INFO", content: "", status: "DRAFT", seoTitle: "", seoDescription: "" }}
      />
    </div>
  );
}
