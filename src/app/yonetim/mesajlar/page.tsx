import { setMessageStatusAction } from "@/app/actions/admin/crm";
import { AdminHeader, Badge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDateTime, formatPhoneForDisplay } from "@/lib/text";

export const metadata = { title: "İletişim mesajları" };

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ arsiv?: string }> }) {
  await requireAdmin();
  const { arsiv } = await searchParams;
  const messages = await db.contactMessage.findMany({
    where: arsiv ? { status: "ARCHIVED" } : { status: { in: ["NEW", "READ"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <AdminHeader
        title="İletişim mesajları"
        actions={
          <a href={arsiv ? "/yonetim/mesajlar" : "/yonetim/mesajlar?arsiv=1"} className="btn btn-sm btn-outline">
            {arsiv ? "Gelen kutusu" : "Arşiv"}
          </a>
        }
      />
      {messages.length === 0 ? <p className="text-sm text-cocoa-500">Mesaj yok.</p> : null}
      <ul className="space-y-4">
        {messages.map((message) => (
          <li key={message.id} className="rounded-2xl border border-cocoa-800/10 bg-white p-5">
            <div className="flex flex-wrap items-center gap-3">
              {message.status === "NEW" ? <Badge tone="warning">Yeni</Badge> : null}
              <span className="font-bold">{message.subject}</span>
              <span className="text-sm text-cocoa-600">
                {message.name} · <a href={`mailto:${message.email}`} className="underline">{message.email}</a>
                {message.phone ? ` · ${formatPhoneForDisplay(message.phone)}` : ""}
              </span>
              <span className="ml-auto text-xs text-cocoa-400">{formatDateTime(message.createdAt)}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-cocoa-800">{message.message}</p>
            <div className="mt-4 flex gap-3">
              {message.status !== "READ" && message.status !== "ARCHIVED" ? (
                <form action={setMessageStatusAction}>
                  <input type="hidden" name="id" value={message.id} />
                  <input type="hidden" name="status" value="READ" />
                  <button type="submit" className="text-xs font-bold text-cocoa-700 underline">
                    Okundu işaretle
                  </button>
                </form>
              ) : null}
              <form action={setMessageStatusAction}>
                <input type="hidden" name="id" value={message.id} />
                <input type="hidden" name="status" value={message.status === "ARCHIVED" ? "READ" : "ARCHIVED"} />
                <button type="submit" className="text-xs font-bold text-cocoa-700 underline">
                  {message.status === "ARCHIVED" ? "Arşivden çıkar" : "Arşivle"}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
