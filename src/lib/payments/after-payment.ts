import "server-only";
import { sendOrderPaidEmails } from "@/lib/orders";
import { revalidateProducts } from "@/lib/revalidate";
import type { FinalizeResult } from "./service";

/** Ödeme kesinleştikten sonra (transaction dışında) yapılan işler: e-postalar ve önbellek yenileme */
export async function afterPaymentFinalized(result: FinalizeResult) {
  if (result.result !== "PROCESSED" || !result.becamePaid || !result.orderId) return;
  try {
    await sendOrderPaidEmails(result.orderId);
  } catch (error) {
    console.error("[ödeme] onay e-postası gönderilemedi", error);
  }
  if (result.productSlugs?.length) revalidateProducts(result.productSlugs);
}
