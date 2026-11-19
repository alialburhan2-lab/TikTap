"use client";

import { useActionState } from "react";
import { uploadDocumentAction, type AdminFormState } from "@/app/admin/actions";

export function DocumentUploadForm({ providers }: { providers: { key: string; label: string }[] }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(uploadDocumentAction, {});
  return (
    <form action={action} className="mt-4 grid gap-3 md:grid-cols-2">
      <label className="md:col-span-2"><span className="label">Provider</span>
        <select name="providerKey" required className="input"><option value="">—</option>{providers.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}</select></label>
      <label><span className="label">Document type</span>
        <select name="docType" className="input">{["contact_check", "business_license", "tourism_license", "identity", "other"].map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}</select></label>
      <label><span className="label">Supports level</span>
        <select name="requestedLevel" className="input">{["contact_verified", "documents_checked", "license_verified"].map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}</select></label>
      <label><span className="label">File (PDF/JPEG/PNG, ≤10 MB)</span><input type="file" name="file" accept="application/pdf,image/jpeg,image/png" className="input" /></label>
      <label><span className="label">Notes</span><input name="notes" className="input" /></label>
      <div className="flex items-center gap-3 md:col-span-2">
        <button className="btn-river" disabled={pending}>Store privately</button>
        {state.message && <span className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
