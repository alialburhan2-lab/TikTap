import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEntityPermission } from "@/lib/auth";
import { getEntityConfig } from "@/lib/admin/entities";
import { labelOf, refOptions } from "@/lib/admin/display";
import { imagesToText } from "@/lib/admin/form";
import { canMarkVerified, canSetProviderLevel } from "@/lib/permissions";
import { repo } from "@/lib/store";
import { EntityForm } from "@/components/admin/entity-form";
import { deleteEntityAction } from "@/app/admin/actions";
import type { ImageAsset } from "@/data/types";

export default async function EditEntity({ params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity, id } = await params;
  const cfg = getEntityConfig(entity);
  if (!cfg) notFound();
  const user = await requireEntityPermission(cfg.name);
  const isNew = id === "new";
  const record = isNew ? null : ((await repo().get(cfg.name, id)) as unknown as Record<string, unknown> | null);
  if (!isNew && !record) notFound();
  const refs = await refOptions(cfg);
  const initial: Record<string, unknown> = { published: true, verificationStatus: "unverified", providerLevel: "unverified", accessStatus: "unknown", coordinatesApproximate: true, active: true, ...(record ?? {}) };
  for (const f of cfg.fields) if (f.type === "images") initial[f.name] = imagesToText(initial[f.name] as ImageAsset[] | undefined);
  const updates = isNew ? [] : (await repo().list("contentUpdates")).filter((u) => u.recordId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);

  return (
    <div className="max-w-4xl">
      <Link href={`/admin/content/${cfg.name}`} className="text-sm text-charcoal-600 hover:underline">← {cfg.label}</Link>
      <h1 className="font-display mt-2 text-3xl font-bold text-river-900">{isNew ? `New — ${cfg.label}` : labelOf(record!)}</h1>
      {!!record?.isDemo && <p className="mt-2 rounded-xl bg-fuchsia-50 px-4 py-2 text-sm text-fuchsia-900">This is a DEMO record. Replace it with verified data or delete it before launch.</p>}
      <EntityForm
        entity={cfg.name} id={isNew ? null : id} fields={cfg.fields} initial={initial} refs={refs}
        canVerify={canMarkVerified(user.role, cfg.name)} canSetLevel={canSetProviderLevel(user.role)}
      />
      {!isNew && (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="card p-5">
            <h2 className="font-semibold text-river-900">Change history</h2>
            {updates.length === 0 ? <p className="mt-2 text-sm text-charcoal-600">No edits recorded yet.</p> : (
              <ul className="mt-2 space-y-1 text-xs">{updates.map((u) => <li key={u.id}><span className="font-mono">{u.createdAt.slice(0, 16).replace("T", " ")}</span> · {u.actorEmail} · {u.summary}</li>)}</ul>
            )}
          </div>
          <form action={deleteEntityAction.bind(null, cfg.name, id)} className="card border border-rose-200 p-5">
            <h2 className="font-semibold text-rose-800">Delete record</h2>
            <p className="mt-1 text-sm text-charcoal-600">This is permanent and logged in the audit trail.</p>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" required /> I understand</label>
            <button className="btn mt-3 bg-rose-600 text-white hover:bg-rose-700">Delete</button>
          </form>
        </div>
      )}
    </div>
  );
}
