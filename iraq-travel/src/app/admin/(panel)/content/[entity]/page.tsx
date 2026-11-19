import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEntityPermission } from "@/lib/auth";
import { getEntityConfig } from "@/lib/admin/entities";
import { cell, labelOf, refOptions } from "@/lib/admin/display";
import { repo } from "@/lib/store";

export default async function EntityList({ params, searchParams }: { params: Promise<{ entity: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { entity } = await params;
  const sp = await searchParams;
  const cfg = getEntityConfig(entity);
  if (!cfg) notFound();
  await requireEntityPermission(cfg.name);
  const q = sp.q?.toLowerCase().trim();
  const rows = (await repo().list(cfg.name)).map((r) => r as unknown as Record<string, unknown>)
    .filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q))
    .sort((a, b) => labelOf(a).localeCompare(labelOf(b)));
  const refs = await refOptions(cfg);
  const refMaps = new Map(cfg.fields.filter((f) => f.ref).map((f) => [f.name, new Map(refs[f.ref!].map((o) => [o.id, o.label]))]));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-river-900">{cfg.label}</h1>
          <p className="text-sm text-charcoal-600">{rows.length} records</p>
        </div>
        <div className="flex gap-2">
          <form className="flex gap-2"><input name="q" defaultValue={sp.q} placeholder="Search…" className="input w-56" /></form>
          <Link href={`/admin/content/${cfg.name}/new`} className="btn-gold">+ Add</Link>
        </div>
      </div>
      {sp.saved && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-900">Saved. Public pages were revalidated.</p>}
      {sp.deleted && <p role="status" className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">Deleted.</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-sand-100 text-xs uppercase tracking-wide text-charcoal-600">
            <tr>{cfg.columns.map((c) => <th key={c} className="px-4 py-3 text-start">{cfg.fields.find((f) => f.name === c)?.label ?? c}</th>)}<th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-sand-200">
            {rows.map((r) => (
              <tr key={String(r.id)} className="hover:bg-sand-50">
                {cfg.columns.map((c, i) => (
                  <td key={c} className="px-4 py-2.5">
                    {i === 0 && r.isDemo ? <span className="me-1 rounded bg-fuchsia-600 px-1 text-[9px] font-bold text-white">DEMO</span> : null}
                    {cell(r[c], refMaps.get(c))}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-end"><Link href={`/admin/content/${cfg.name}/${String(r.id)}`} className="font-semibold text-river-700 hover:underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
