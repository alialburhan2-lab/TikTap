import { requireRole } from "@/lib/auth";
import { repo } from "@/lib/store";
import { DocumentUploadForm } from "@/components/admin/document-upload-form";
import { reviewDocumentAction } from "@/app/admin/actions";

export default async function VerificationPage() {
  await requireRole("verification_officer");
  const r = repo();
  const [hotels, restaurants, guides, transport, docs] = await Promise.all([r.list("hotels"), r.list("restaurants"), r.list("tourGuides"), r.list("transportProviders"), r.list("verificationDocuments")]);
  const providers = [
    ...hotels.map((p) => ({ key: `hotels:${p.id}`, id: p.id, name: p.name, kind: "Hotel", level: p.providerLevel })),
    ...restaurants.map((p) => ({ key: `restaurants:${p.id}`, id: p.id, name: p.name, kind: "Restaurant", level: p.providerLevel })),
    ...guides.map((p) => ({ key: `tourGuides:${p.id}`, id: p.id, name: p.name, kind: p.kind === "agency" ? "Agency" : p.kind === "driver" ? "Driver" : "Guide", level: p.providerLevel })),
    ...transport.map((p) => ({ key: `transportProviders:${p.id}`, id: p.id, name: p.name, kind: "Transport", level: p.providerLevel })),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const nameOf = new Map(providers.map((p) => [p.id, `${p.name} (${p.kind})`]));
  const pending = docs.filter((d) => d.status === "pending");
  const reviewed = docs.filter((d) => d.status !== "pending").sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-river-900">Provider verification</h1>
        <p className="text-sm text-charcoal-600">Each provider has a verification file. Levels are raised only when an officer approves a document supporting that level. Documents are stored privately.</p>
      </div>
      <section className="card p-6">
        <h2 className="font-semibold text-river-900">Add document to a provider&apos;s file</h2>
        <DocumentUploadForm providers={providers.map(({ key, name, kind }) => ({ key, label: `${name} — ${kind}` }))} />
      </section>
      <section>
        <h2 className="mb-3 font-semibold text-river-900">Pending review ({pending.length})</h2>
        {pending.length === 0 && <p className="card p-5 text-sm text-charcoal-600">Nothing pending.</p>}
        <ul className="space-y-3">
          {pending.map((d) => (
            <li key={d.id} className="card p-5">
              <p className="font-medium">{nameOf.get(d.providerId) ?? d.providerId}</p>
              <p className="text-xs text-charcoal-600">{d.docType.replace("_", " ")} → requested level <strong>{d.requestedLevel.replace("_", " ")}</strong> · uploaded {d.createdAt.slice(0, 10)}</p>
              {d.notes && <p className="mt-1 text-sm">{d.notes}</p>}
              {d.storagePath ? <a href={`/admin/documents/${d.id}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-river-700 underline">Open document (private)</a> : <p className="mt-2 text-xs italic">No file (contact check)</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={reviewDocumentAction.bind(null, d.id, "approved")} className="flex flex-wrap gap-2">
                  <input name="notes" placeholder="Review notes" className="input w-64" />
                  <button className="btn bg-emerald-600 text-white hover:bg-emerald-700">Approve</button>
                </form>
                <form action={reviewDocumentAction.bind(null, d.id, "rejected")}><input type="hidden" name="notes" value="Rejected" /><button className="btn bg-rose-600 text-white hover:bg-rose-700">Reject</button></form>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="card p-6">
        <h2 className="font-semibold text-river-900">Provider levels</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-xs uppercase text-charcoal-600"><tr><th className="py-2 text-start">Provider</th><th className="text-start">Type</th><th className="text-start">Level</th><th className="text-start">Documents</th></tr></thead>
          <tbody className="divide-y divide-sand-200">
            {providers.map((p) => <tr key={p.key}><td className="py-2">{p.name}</td><td>{p.kind}</td><td className="font-mono text-xs">{p.level}</td><td>{docs.filter((d) => d.providerId === p.id).length}</td></tr>)}
          </tbody>
        </table>
      </section>
      <section className="card p-6">
        <h2 className="font-semibold text-river-900">Review history</h2>
        {reviewed.length === 0 ? <p className="mt-2 text-sm text-charcoal-600">None yet.</p> : (
          <ul className="mt-2 space-y-1 text-xs">{reviewed.map((d) => <li key={d.id}>{d.reviewedAt?.slice(0, 16).replace("T", " ")} · {d.reviewedBy} · <strong>{d.status}</strong> · {nameOf.get(d.providerId)} · {d.requestedLevel}</li>)}</ul>
        )}
      </section>
    </div>
  );
}
