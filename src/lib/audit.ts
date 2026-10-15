import "server-only";
import { db } from "@/lib/db";

export async function audit(actorId: string | null, action: string, entityType: string, entityId: string | null, summary?: string) {
  await db.auditLog
    .create({ data: { actorId, action, entityType, entityId, summary: summary?.slice(0, 500) ?? null } })
    .catch((error) => console.error("[audit] kayıt yazılamadı", error));
}
