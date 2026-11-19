"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary";
import { haversineKm } from "@/lib/geo";
import type { MapLine, MapMarker } from "./leaflet-map";

const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false, loading: () => <div className="h-[600px] animate-pulse rounded-2xl bg-sand-200" /> });

export type ExplorerPoint = {
  id: string; layer: "site" | "natural" | "hotel" | "restaurant" | "airport" | "railway" | "hospital";
  name: string; subtitle: string; lat: number; lng: number; href: string | null; approximate: boolean; demo: boolean;
};

const COLORS: Record<ExplorerPoint["layer"], string> = {
  site: "#b8892b", natural: "#2f8f5b", hotel: "#2f6aa8", restaurant: "#c2410c", airport: "#0f2a4a", railway: "#6b21a8", hospital: "#e11d48",
};
const LAYERS: ExplorerPoint["layer"][] = ["site", "natural", "hotel", "restaurant", "airport", "railway", "hospital"];

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function MapExplorer({ points, t, common }: { points: ExplorerPoint[]; t: Dictionary["map"]; common: Dictionary["common"] }) {
  const [active, setActive] = useState<Set<string>>(new Set(LAYERS));
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [route, setRoute] = useState<string[]>([]);
  const byId = useMemo(() => new Map(points.map((p) => [p.id, p])), [points]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return points.filter((p) => active.has(p.layer) && (!q || `${p.name} ${p.subtitle}`.toLowerCase().includes(q)));
  }, [points, active, query]);

  const markers: MapMarker[] = useMemo(() => visible.map((p) => ({
    id: p.id, lat: p.lat, lng: p.lng, title: p.name, color: COLORS[p.layer],
    html: `<strong>${esc(p.name)}</strong>${p.demo ? ' <span style="background:#c026d3;color:#fff;border-radius:4px;padding:0 4px;font-size:10px">DEMO</span>' : ""}<br/><span style="color:#4a525c">${esc(p.subtitle)}</span>${p.href ? `<br/><a href="${p.href}">${esc(common.learnMore)} →</a>` : ""}`,
  })), [visible, common.learnMore]);

  const routePts = route.map((id) => byId.get(id)).filter(Boolean) as ExplorerPoint[];
  const lines: MapLine[] = useMemo(() => (routePts.length > 1 ? [{ points: routePts.map((p) => [p.lat, p.lng] as [number, number]), dashed: true }] : []), [routePts]);
  const legs = routePts.slice(1).map((p, i) => haversineKm(routePts[i], p));
  const totalKm = legs.reduce((a, b) => a + b, 0);

  const sel = selected ? byId.get(selected) : null;
  const nearby = sel ? points.filter((p) => p.id !== sel.id && (p.layer === "site" || p.layer === "natural")).map((p) => ({ p, d: haversineKm(sel, p) })).sort((a, b) => a.d - b.d).slice(0, 5) : [];

  const download = (kind: "gpx" | "json") => {
    if (!routePts.length) return;
    const content = kind === "json"
      ? JSON.stringify({ generator: "IRAQ TRAVEL", warning: t.routeWarning, points: routePts.map(({ name, lat, lng, subtitle }) => ({ name, subtitle, lat, lng })), straightLineKm: Math.round(totalKm) }, null, 2)
      : `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="IRAQ TRAVEL" xmlns="http://www.topografix.com/GPX/1/1">\n<metadata><desc>${esc(t.routeWarning)}</desc></metadata>\n${routePts.map((p) => `<wpt lat="${p.lat}" lon="${p.lng}"><name>${esc(p.name)}</name></wpt>`).join("\n")}\n<rte>${routePts.map((p) => `<rtept lat="${p.lat}" lon="${p.lng}"><name>${esc(p.name)}</name></rtept>`).join("")}</rte>\n</gpx>`;
    const blob = new Blob([content], { type: kind === "json" ? "application/json" : "application/gpx+xml" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `iraq-travel-route.${kind}` });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="container-x mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} className="input" />
        <LeafletMap markers={markers} lines={lines} selectedId={selected} onSelect={setSelected} height={600} />
        <p className="text-xs text-charcoal-600">{common.approxCoords} · {t.hospitalsPending}</p>
      </div>
      <aside className="space-y-4">
        <fieldset className="card p-5">
          <legend className="sr-only">{t.layers}</legend>
          <p className="label">{t.layers}</p>
          <ul className="space-y-1.5">
            {LAYERS.map((l) => {
              const count = points.filter((p) => p.layer === l).length;
              return (
                <li key={l}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={active.has(l)} onChange={() => setActive((s) => { const n = new Set(s); if (n.has(l)) n.delete(l); else n.add(l); return n; })} />
                    <span className="h-3 w-3 rounded-full" style={{ background: COLORS[l] }} aria-hidden />
                    <span className="flex-1">{t.layerNames[l]}</span><span className="text-xs text-charcoal-600">{count}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        {sel && (
          <div className="card p-5">
            <p className="font-display text-lg font-bold text-river-900">{sel.name}</p>
            <p className="text-sm text-charcoal-600">{sel.subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sel.href && <Link href={sel.href} className="btn-river px-3 py-1.5 text-xs">{common.learnMore}</Link>}
              <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={() => setRoute((r) => (r.includes(sel.id) ? r : [...r, sel.id]))}>+ {t.addToRoute}</button>
            </div>
            {nearby.length > 0 && (
              <>
                <p className="label mt-4">{t.nearby}</p>
                <ul className="space-y-1 text-sm">
                  {nearby.map(({ p, d }) => <li key={p.id}><button type="button" className="text-start text-river-700 hover:underline" onClick={() => setSelected(p.id)}>{p.name}</button> <span className="text-charcoal-600">{d < 1 ? "< 1" : `≈ ${Math.round(d)}`} {common.km}</span></li>)}
                </ul>
              </>
            )}
          </div>
        )}

        <div className="card p-5">
          <p className="label">{t.route}</p>
          {routePts.length === 0 ? <p className="text-sm text-charcoal-600">{t.routeHelp}</p> : (
            <ol className="space-y-1 text-sm">
              {routePts.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span>{i + 1}. {p.name}{i > 0 && <span className="text-xs text-charcoal-600"> (+{Math.round(legs[i - 1])} {common.km})</span>}</span>
                  <button type="button" className="text-xs text-rose-700" onClick={() => setRoute((r) => r.filter((x) => x !== p.id))} aria-label={`Remove ${p.name}`}>✕</button>
                </li>
              ))}
            </ol>
          )}
          {routePts.length > 1 && <p className="mt-3 text-sm font-semibold text-river-900">{t.measure}: ≈ {Math.round(totalKm)} {common.km}</p>}
          <p className="mt-2 text-xs text-amber-800">{t.routeWarning}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-outline px-3 py-1.5 text-xs" disabled={!routePts.length} onClick={() => download("gpx")}>{t.downloadGpx}</button>
            <button type="button" className="btn-outline px-3 py-1.5 text-xs" disabled={!routePts.length} onClick={() => download("json")}>{t.downloadJson}</button>
            <button type="button" className="btn-outline px-3 py-1.5 text-xs" disabled={!routePts.length} onClick={() => setRoute([])}>{t.clear}</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
