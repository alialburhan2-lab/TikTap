import "server-only";
import type { EntityName } from "@/data/types";
import type { SessionUser } from "@/lib/auth";
import { repo, newId } from "@/lib/store";

/** Append-only audit trail (admin_logs) + content update history (content_updates). */
export async function audit(actor: SessionUser, action: string, entity: EntityName | string, recordId: string | null, details?: string) {
  const at = new Date().toISOString();
  await repo().upsert("adminLogs", {
    id: newId(), createdAt: at, updatedAt: at, published: false,
    actorId: actor.id, actorEmail: actor.email, action, entity, recordId, details: details?.slice(0, 2000) ?? null,
  });
  if (recordId && ["create", "update", "delete"].includes(action)) {
    await repo().upsert("contentUpdates", { id: newId(), createdAt: at, updatedAt: at, published: false, entity, recordId, summary: `${action}${details ? `: ${details.slice(0, 300)}` : ""}`, actorEmail: actor.email });
  }
}
