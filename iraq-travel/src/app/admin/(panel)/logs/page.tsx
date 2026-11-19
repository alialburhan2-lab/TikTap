import { requireRole } from "@/lib/auth";
import { repo } from "@/lib/store";

export default async function LogsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("super_admin");
  const { q } = await searchParams;
  const logs = (await repo().list("adminLogs")).filter((l) => !q || JSON.stringify(l).toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 500);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-river-900">Audit log</h1>
        <form><input name="q" defaultValue={q} placeholder="Filter…" className="input w-64" /></form>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-sand-100 text-xs uppercase text-charcoal-600"><tr>{["Time (UTC)", "Actor", "Action", "Entity", "Record", "Details"].map((h) => <th key={h} className="px-4 py-2 text-start">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-sand-200">
            {logs.map((l) => (
              <tr key={l.id} className="align-top">
                <td className="px-4 py-2 font-mono text-xs">{l.createdAt.slice(0, 19).replace("T", " ")}</td>
                <td className="px-4 py-2">{l.actorEmail}</td>
                <td className="px-4 py-2 font-semibold">{l.action}</td>
                <td className="px-4 py-2">{l.entity}</td>
                <td className="px-4 py-2 font-mono text-xs">{l.recordId?.slice(0, 8) ?? "—"}</td>
                <td className="px-4 py-2 text-xs text-charcoal-600">{l.details ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="p-6 text-sm text-charcoal-600">No entries.</p>}
      </div>
    </div>
  );
}
