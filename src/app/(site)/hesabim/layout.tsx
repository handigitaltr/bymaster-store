import type { Metadata } from "next";
import { AccountNav } from "@/components/account/AccountNav";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Hesabım", robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="container-page pb-24 pt-10">
      <p className="eyebrow">Hesabım</p>
      <h1 className="display-md mt-2 text-cocoa-900">Merhaba, {user.name.split(" ")[0]}</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_1fr]">
        <AccountNav isAdmin={user.role === "ADMIN"} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
