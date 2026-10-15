import { AddressBook } from "@/components/account/AccountForms";
import { requireUser } from "@/lib/auth/guards";
import { SORTED_TR_CITIES } from "@/lib/constants";
import { db } from "@/lib/db";

export default async function AddressesPage() {
  const user = await requireUser("/hesabim/adresler");
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: { id: true, title: true, fullName: true, phone: true, city: true, district: true, addressLine: true, postalCode: true, isDefault: true },
  });
  return <AddressBook addresses={addresses} cities={[...SORTED_TR_CITIES]} />;
}
