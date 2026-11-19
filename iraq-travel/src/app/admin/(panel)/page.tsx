import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/store";
import { VERIFICATION_STATUSES, type EntityName } from "@/data/types";
import { ENTITIES, ENTITY_ORDER } from "@/lib/admin/entities";
import { isStale } from "@/lib/localize";

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireStaff();
  const { denied } = await searchParams;
  const r = repo();
  const counts = await Promise.all(ENTITY_ORDER.map(async (e) => ({ e, list: await r.list(e) })));
  const [reports, docs, reviews, logs] = await Promise.all([r.list("scamReports"), r.list("verificationDocuments"), r.list("reviews"), r.list("adminLogs")]);
  const all = counts.flatMap((c) => c.list as unknown as { verificationStatus?: string; isDemo?: boolean; lastVerified?: string | null; lastUpdated?: string }[]);
  const statusCounts = VERIFICATION_STATUSES.map((s) => ({ s, n: all.filter((x) => x.verificationStatus === s).length }));
  const totalWithStatus = statusCounts.reduce((a, b) => a + b.n, 0) || 1;
  const stalePrices = (await r.list("priceRecords")).filter((p) => isStale(p.lastUpdated)).length;
  const demoCount = all.filter((x) => x.isDemo).length;
  const tasks = [
    { label: "New complaints / scam reports", n: reports.filter((x) => x.status === "new").length, href: "/admin/reports" },
    { label: "Verification documents pending", n: docs.filter((d) => d.status === "pending").length, href: "/admin/verification" },
    { label: "Reviews awaiting moderation", n: reviews.filter((x) => x.status === "pending").length, href: "/admin/content/reviews" },
    { label: "Price records older than 6 months", n: stalePrices, href: "/admin/content/priceRecords" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-river-900">Welcome, {user.displayName}</h1>
        <p className="text-charcoal-600">Content health, moderation queues and data-quality analytics.</p>
      </div>
      {denied && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-500/30">Access denied: your role ({user.role}) does not have permission for that area.</p>}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tasks.map((t) => (
          <Link key={t.label} href={t.href} className="card card-hover p-5">
            <p className={`font-display text-4xl font-bold ${t.n ? "text-rose-700" : "text-river-900"}`}>{t.n}</p>
            <p className="mt-1 text-sm text-charcoal-600">{t.label}</p>
          </Link>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold text-river-900">Data verification status (all records)</h2>
          <ul className="mt-4 space-y-2">
            {statusCounts.map(({ s, n }) => (
              <li key={s} className="text-sm">
                <div className="flex justify-between"><span className="capitalize">{s.replace("_", " ")}</span><span className="font-mono">{n}</span></div>
                <div className="mt-1 h-2 rounded-full bg-sand-200"><div className="h-2 rounded-full bg-river-700" style={{ width: `${(n / totalWithStatus) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-charcoal-600">{demoCount} records are flagged as DEMO and should be replaced by verified data before launch.</p>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold text-river-900">Content inventory</h2>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-sand-200">
              {counts.map(({ e, list }) => (
                <tr key={e}><td className="py-1.5"><Link className="hover:underline" href={`/admin/content/${e}`}>{ENTITIES[e as EntityName]?.label}</Link></td><td className="py-1.5 text-end font-mono">{list.length}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card p-6">
        <h2 className="font-semibold text-river-900">Visitor analytics</h2>
        <p className="mt-2 text-sm text-charcoal-600">Page-view analytics are not collected by this application. Connect a privacy-friendly analytics provider (for example Vercel Web Analytics or Plausible) — see README → “Analytics”. Admin activity: <strong>{logs.length}</strong> audit-log entries.</p>
      </section>
    </div>
  );
}
