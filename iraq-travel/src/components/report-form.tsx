"use client";

import { useActionState } from "react";
import { submitReport, type FormState } from "@/app/actions/public";
import type { Dictionary } from "@/i18n/dictionary";
import type { ReportType } from "@/data/types";

export function ReportForm({ t, governorates, types }: { t: Dictionary["protection"]; governorates: { id: string; name: string }[]; types: ReportType[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitReport, { ok: false });
  if (state.ok) return <div role="status" className="rounded-2xl bg-emerald-50 p-6 text-emerald-900 ring-1 ring-emerald-600/20">{t.form.sent}</div>;
  const err = (k: string) => state.errors?.[k] && <p className="mt-1 text-xs text-rose-700">{state.errors[k]}</p>;
  return (
    <form action={action} className="card grid gap-4 p-6 md:grid-cols-2" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="md:col-span-2"><span className="label">{t.form.type}</span>
        <select name="type" className="input" defaultValue="overcharging">{types.map((ty) => <option key={ty} value={ty}>{t.reportTypes[ty]}</option>)}</select></label>
      <label><span className="label">{t.form.provider} *</span><input name="providerName" required maxLength={160} className="input" />{err("providerName")}</label>
      <label><span className="label">{t.form.providerType}</span>
        <select name="providerType" className="input" defaultValue="">
          <option value="">—</option>
          {["hotel", "restaurant", "taxi", "driver", "tour_guide", "travel_agency", "other"].map((p) => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
        </select></label>
      <label><span className="label">{t.form.governorate}</span>
        <select name="governorateId" className="input" defaultValue=""><option value="">—</option>{governorates.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
      <label><span className="label">{t.form.date}</span><input name="incidentDate" type="date" className="input" />{err("incidentDate")}</label>
      <label className="md:col-span-2"><span className="label">{t.form.description} *</span><textarea name="description" rows={5} required minLength={20} maxLength={4000} className="input" />{err("description")}</label>
      <label><span className="label">{t.form.paid}</span><input name="amountPaid" maxLength={60} className="input" placeholder="e.g. 30,000 IQD" /></label>
      <label><span className="label">{t.form.expected}</span><input name="expectedAmount" maxLength={60} className="input" /></label>
      <label className="md:col-span-2"><span className="label">{t.form.email}</span><input name="contactEmail" type="email" maxLength={200} className="input" autoComplete="email" />{err("contactEmail")}</label>
      <label className="flex items-start gap-2 text-sm md:col-span-2"><input type="checkbox" name="consent" className="mt-1" required /> {t.form.consent}</label>
      {err("consent")}
      {(state.message || (state.errors && Object.keys(state.errors).length > 0)) && <p className="text-sm text-rose-700 md:col-span-2">{state.message ?? t.form.error}</p>}
      <button className="btn-river justify-self-start" disabled={pending}>{pending ? "…" : t.reportTypes.complaint}</button>
    </form>
  );
}
