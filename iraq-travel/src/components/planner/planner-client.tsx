"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { INTERESTS, type Interest } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { buildPlan, costDay, summarize, type BudgetLevel, type PlanDay, type PlannerData, type PlannerInput, type PlanResult, type TransportPref } from "@/lib/planner";
import { formatIqd, formatUsd } from "@/lib/money";
import { saveItinerary } from "@/app/actions/public";

type Props = {
  data: PlannerData; locale: Locale; t: Dictionary["planner"]; common: Dictionary["common"]; interestsLabels: Dictionary["interests"];
  hotelCats: Dictionary["hotelCats"]; modes: Dictionary["modes"]; initial: { arrival?: string; budget?: string; days?: string };
};

const today = () => new Date().toISOString().slice(0, 10);
const plus = (iso: string, n: number) => { const d = new Date(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export function PlannerClient({ data, locale, t, common, interestsLabels, hotelCats, modes, initial }: Props) {
  const bySlug = useMemo(() => new Map(data.governorates.map((g) => [g.slug, g.id])), [data.governorates]);
  const defaultArrival = (initial.arrival && bySlug.get(initial.arrival)) || bySlug.get("baghdad") || data.governorates[0]?.id || "";
  const startDefault = plus(today(), 30);
  const nDays = Math.min(21, Math.max(1, Number(initial.days) || 7));
  const [input, setInput] = useState<PlannerInput>({
    arrivalGovId: defaultArrival, departureGovId: defaultArrival, startDate: startDefault, endDate: plus(startDefault, nDays - 1), travelers: 2,
    budget: (["budget", "mid_range", "luxury"].includes(initial.budget ?? "") ? initial.budget : "mid_range") as BudgetLevel,
    interests: ["archaeology", "history", "culture"], transport: "private_car", hotelCategory: "mid_range",
  });
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const rate = data.iqdPerUsd;
  const siteById = useMemo(() => new Map(data.sites.map((s) => [s.id, s])), [data.sites]);
  const set = <K extends keyof PlannerInput>(k: K, v: PlannerInput[K]) => setInput((i) => ({ ...i, [k]: v }));

  const recompute = (days: PlanDay[]) => {
    const recosted = days.map((d, i) => costDay(d, input, data, i === days.length - 1));
    const sum = summarize(recosted);
    setPlan((p) => (p ? { ...p, days: recosted, ...sum } : p));
  };
  const removeStop = (dayIdx: number, siteId: string) => plan && recompute(plan.days.map((d) => (d.index === dayIdx ? { ...d, stops: d.stops.filter((s) => s.siteId !== siteId) } : d)));
  const addStop = (dayIdx: number, siteId: string) => {
    const s = siteById.get(siteId);
    if (!plan || !s) return;
    recompute(plan.days.map((d) => (d.index === dayIdx ? { ...d, stops: [...d.stops, { siteId: s.id, name: s.name, slug: s.slug, visitHours: s.recommendedVisitHours, entranceFee: s.entranceFee }] } : d)));
  };
  const excludedIds = new Set(plan?.excluded.map((e) => e.siteId));
  const money = (iqd: number | null) => (iqd == null ? common.priceNotVerified : `${formatIqd(iqd, locale)} · ${formatUsd(iqd / rate, locale)}`);

  const asText = () => {
    if (!plan) return "";
    const lines = [`IRAQ TRAVEL — ${t.title}`, `${input.startDate} → ${input.endDate} · ${input.travelers} ${t.travelers}`, ""];
    for (const d of plan.days) {
      lines.push(`${t.day} ${d.index + 1} (${d.date}) — ${d.governorateName}${d.travelKm ? ` · ${t.travel} ≈${d.travelKm} km` : ""}`);
      for (const s of d.stops) lines.push(`  • ${s.name} (${s.visitHours} h)`);
      lines.push(`  ${t.dailyTotal}: ${money(d.totalIqd)}${d.incomplete ? " (incomplete)" : ""}`, "");
    }
    lines.push(`${t.overallTotal}: ${money(plan.totalIqd)}`, "", t.distanceNote, ...plan.warnings.map((w) => `! ${t.warnings[w as keyof typeof t.warnings] ?? w}`));
    return lines.join("\n");
  };
  const download = () => {
    const blob = new Blob([asText()], { type: "text/plain;charset=utf-8" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `iraq-travel-itinerary-${input.startDate}.txt` });
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const save = async () => {
    if (!plan) return;
    localStorage.setItem("iraq-travel:itinerary", JSON.stringify({ input, plan }));
    const res = await saveItinerary({ title: `${input.startDate} ${plan.days.length}d`, input, days: plan.days }).catch(() => ({ ok: false }));
    setSavedMsg(res.ok ? t.saved : `${t.saved} (local)`);
  };

  return (
    <div className="container-x mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
      <form className="card h-fit space-y-4 p-6 lg:sticky lg:top-24" onSubmit={(e) => { e.preventDefault(); setSavedMsg(null); setPlan(buildPlan(input, data)); }}>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm"><span className="label">{t.arrival}</span>
            <select className="input" value={input.arrivalGovId} onChange={(e) => set("arrivalGovId", e.target.value)}>{data.governorates.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
          <label className="text-sm"><span className="label">{t.departure}</span>
            <select className="input" value={input.departureGovId} onChange={(e) => set("departureGovId", e.target.value)}>{data.governorates.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
          <label className="text-sm"><span className="label">{t.start}</span><input type="date" className="input" value={input.startDate} min={today()} onChange={(e) => set("startDate", e.target.value)} required /></label>
          <label className="text-sm"><span className="label">{t.end}</span><input type="date" className="input" value={input.endDate} min={input.startDate} onChange={(e) => set("endDate", e.target.value)} required /></label>
          <label className="text-sm"><span className="label">{t.travelers}</span><input type="number" min={1} max={30} className="input" value={input.travelers} onChange={(e) => set("travelers", Math.max(1, Math.min(30, Number(e.target.value) || 1)))} /></label>
          <label className="text-sm"><span className="label">{t.budget}</span>
            <select className="input" value={input.budget} onChange={(e) => set("budget", e.target.value as BudgetLevel)}>{(["budget", "mid_range", "luxury"] as const).map((b) => <option key={b} value={b}>{t.budgetLevels[b]}</option>)}</select></label>
          <label className="text-sm"><span className="label">{t.transport}</span>
            <select className="input" value={input.transport} onChange={(e) => set("transport", e.target.value as TransportPref)}>
              {(["private_car", "domestic_flight", "train"] as const).map((m) => <option key={m} value={m}>{modes[m]}</option>)}<option value="mixed">{t.mixed}</option></select></label>
          <label className="text-sm"><span className="label">{t.hotel}</span>
            <select className="input" value={input.hotelCategory} onChange={(e) => set("hotelCategory", e.target.value as PlannerInput["hotelCategory"])}>
              {(Object.keys(hotelCats) as (keyof typeof hotelCats)[]).map((h) => <option key={h} value={h}>{hotelCats[h]}</option>)}</select></label>
        </div>
        <fieldset>
          <legend className="label">{t.interests}</legend>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i: Interest) => {
              const on = input.interests.includes(i);
              return (
                <button key={i} type="button" aria-pressed={on} onClick={() => set("interests", on ? input.interests.filter((x) => x !== i) : [...input.interests, i])}
                  className={`rounded-full px-3 py-1.5 text-sm ring-1 ${on ? "bg-river-900 text-white ring-river-900" : "bg-white text-river-900 ring-river-900/15"}`}>{interestsLabels[i]}</button>
              );
            })}
          </div>
        </fieldset>
        <button type="submit" className="btn-gold w-full">{t.generate}</button>
        <p className="text-xs text-charcoal-600">{t.distanceNote}</p>
      </form>

      <section aria-live="polite">
        {!plan && <div className="card flex min-h-64 items-center justify-center p-10 text-center text-charcoal-600">{t.intro}</div>}
        {plan && (
          <div className="space-y-5">
            {plan.warnings.map((w) => (
              <div key={w} role="note" className={`rounded-xl px-4 py-3 text-sm ring-1 ${w === "uses_demo_data" ? "bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-500/30" : "bg-amber-50 text-amber-900 ring-amber-500/30"}`}>{t.warnings[w as keyof typeof t.warnings] ?? w}</div>
            ))}
            {plan.days.map((d) => (
              <article key={d.index} className="card overflow-hidden">
                <header className="flex flex-wrap items-center justify-between gap-2 bg-river-900 px-5 py-3 text-white">
                  <h2 className="font-display text-lg font-bold">{t.day} {d.index + 1} · {d.governorateName}</h2>
                  <span className="text-sm text-sand-200">{d.date}{d.travelKm > 0 && ` · ${t.travel} ≈ ${d.travelKm} ${common.km} (${d.travelHours} ${common.hours})`}</span>
                </header>
                <div className="grid gap-5 p-5 md:grid-cols-2">
                  <div>
                    {d.stops.length === 0 ? <p className="text-sm italic text-charcoal-600">{t.noStops}</p> : (
                      <ol className="space-y-2">
                        {d.stops.map((s) => (
                          <li key={s.siteId} className="flex items-start justify-between gap-2 rounded-xl bg-sand-100 px-3 py-2">
                            <span><Link href={`/${locale}/destinations/${s.slug}`} className="font-medium text-river-900 hover:underline">{s.name}</Link>
                              <span className="block text-xs text-charcoal-600">{t.visit}: {s.visitHours} {common.hours} · {common.entranceFee}: {s.entranceFee ?? common.priceNotVerified}</span></span>
                            <button type="button" onClick={() => removeStop(d.index, s.siteId)} className="text-xs font-semibold text-rose-700 hover:underline no-print">{t.remove}</button>
                          </li>
                        ))}
                      </ol>
                    )}
                    <label className="mt-3 flex items-center gap-2 no-print">
                      <span className="sr-only">{t.addSite}</span>
                      <select className="input" defaultValue="" onChange={(e) => { if (e.target.value) { addStop(d.index, e.target.value); e.target.value = ""; } }}>
                        <option value="">+ {t.addSite}</option>
                        {data.sites.filter((s) => !excludedIds.has(s.id) && !d.stops.some((x) => x.siteId === s.id)).sort((a, b) => (a.governorateId === d.governorateId ? -1 : 1) - (b.governorateId === d.governorateId ? -1 : 1)).map((s) => (
                          <option key={s.id} value={s.id}>{s.name}{s.governorateId !== d.governorateId ? ` (${data.governorates.find((g) => g.id === s.governorateId)?.name})` : ""}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <dl className="space-y-1.5 text-sm">
                    {([["transport", t.transportCost], ["hotel", t.hotelCost], ["food", t.foodBudget], ["entrance", t.entranceFees]] as const).map(([k, label]) => {
                      const c = d.costs[k];
                      return (
                        <div key={k} className="flex justify-between gap-3 border-b border-sand-200 pb-1.5" title={c.basis}>
                          <dt className="text-charcoal-600">{label}{c.demo && <span className="ms-1 rounded bg-fuchsia-600 px-1 text-[9px] font-bold text-white">{common.demo}</span>}</dt>
                          <dd className={`text-end ${c.amountIqd == null ? "italic text-charcoal-600" : "font-medium"}`}>{c.amountIqd == null ? common.priceNotVerified : money(c.amountIqd)}</dd>
                        </div>
                      );
                    })}
                    <div className="flex justify-between gap-3 pt-1 font-bold text-river-900"><dt>{t.dailyTotal}</dt><dd>{money(d.totalIqd)}{d.incomplete && " *"}</dd></div>
                  </dl>
                </div>
              </article>
            ))}
            <div className="card flex flex-wrap items-center justify-between gap-4 bg-gold-500 p-6 text-white">
              <div><p className="text-sm uppercase tracking-wider text-white/80">{t.overallTotal}</p><p className="font-display text-3xl font-bold">{money(plan.totalIqd)}{plan.incomplete && " *"}</p></div>
              <div className="flex flex-wrap gap-2 no-print">
                <button type="button" onClick={download} className="btn bg-white text-gold-700">{t.download}</button>
                <button type="button" onClick={() => window.print()} className="btn bg-white/20 text-white ring-1 ring-white/50">{t.print}</button>
                <button type="button" onClick={save} className="btn bg-white/20 text-white ring-1 ring-white/50">{savedMsg ?? t.save}</button>
              </div>
            </div>
            {plan.excluded.length > 0 && (
              <details className="card p-5">
                <summary className="cursor-pointer font-semibold text-river-900">{t.excluded} ({plan.excluded.length})</summary>
                <ul className="mt-3 space-y-1 text-sm">{plan.excluded.map((e) => <li key={e.siteId}>{e.name} — <span className="text-charcoal-600">{t.excludedReasons[e.reason as keyof typeof t.excludedReasons] ?? e.reason}</span></li>)}</ul>
              </details>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
