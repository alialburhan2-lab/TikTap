import { requireRole } from "@/lib/auth";
import { repo } from "@/lib/store";
import { ReportActionForm } from "@/components/admin/report-action-form";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("verification_officer");
  const { status } = await searchParams;
  const [reports, governorates] = await Promise.all([repo().list("scamReports"), repo().list("governorates")]);
  const gov = new Map(governorates.map((g) => [g.id, g.name.en]));
  const list = reports.filter((r) => !status || r.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const statuses = ["new", "under_review", "action_taken", "dismissed"];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-river-900">Complaints & scam reports</h1>
        <p className="text-sm text-charcoal-600">Internal log. Reports are never published automatically; reporter emails are private.</p>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm">
        <a href="/admin/reports" className={`rounded-full px-3 py-1 ring-1 ring-river-900/15 ${!status ? "bg-river-900 text-white" : "bg-white"}`}>All ({reports.length})</a>
        {statuses.map((s) => <a key={s} href={`/admin/reports?status=${s}`} className={`rounded-full px-3 py-1 ring-1 ring-river-900/15 ${status === s ? "bg-river-900 text-white" : "bg-white"}`}>{s.replace("_", " ")} ({reports.filter((r) => r.status === s).length})</a>)}
      </nav>
      {list.length === 0 && <p className="card p-6 text-sm text-charcoal-600">No reports.</p>}
      {list.map((r) => (
        <article key={r.id} className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-river-900">{r.isDemo && <span className="me-1 rounded bg-fuchsia-600 px-1 text-[9px] font-bold text-white">DEMO</span>}{r.type.replace("_", " ")} — {r.providerName}</h2>
            <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold">{r.status.replace("_", " ")}</span>
          </div>
          <p className="mt-1 text-xs text-charcoal-600">{r.createdAt.slice(0, 10)} · {r.providerType ?? "—"} · {r.governorateId ? gov.get(r.governorateId) : "—"} · incident {r.incidentDate ?? "—"}</p>
          <p className="mt-3 whitespace-pre-line text-sm">{r.description}</p>
          <p className="mt-2 text-sm text-charcoal-600">Paid: {r.amountPaid ?? "—"} · Expected: {r.expectedAmount ?? "—"} · Contact: {r.contactEmail ? <span className="font-mono">{r.contactEmail}</span> : "none"}</p>
          {r.actions.length > 0 && (
            <ol className="mt-4 space-y-1 border-s-2 border-gold-400 ps-4 text-xs">
              {r.actions.map((a, i) => <li key={i}><span className="font-mono">{a.at.slice(0, 16).replace("T", " ")}</span> · {a.by}: {a.note}</li>)}
            </ol>
          )}
          <ReportActionForm id={r.id} status={r.status} />
        </article>
      ))}
    </div>
  );
}
