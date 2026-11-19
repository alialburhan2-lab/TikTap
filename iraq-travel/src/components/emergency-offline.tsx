"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary";

type Info = Record<keyof Dictionary["emergency"]["myInfoFields"], string>;
const KEY = "iraq-travel:emergency-info";
const EMPTY: Info = { name: "", blood: "", allergies: "", contact: "", insurance: "", embassy: "" };

/** Personal emergency card kept ONLY in this browser (localStorage); plus offline caching of this page. */
export function EmergencyOffline({ t, locale, contacts }: { t: Dictionary["emergency"]; locale: string; contacts: { name: string; phone: string | null }[] }) {
  const [info, setInfo] = useState<Info>(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setInfo({ ...EMPTY, ...JSON.parse(raw) });
    } catch { /* ignore corrupt storage */ }
  }, []);

  const saveInfo = () => {
    localStorage.setItem(KEY, JSON.stringify(info));
    setMsg("✓");
  };

  const saveOffline = async () => {
    if (!("serviceWorker" in navigator)) return setMsg("Offline mode is not supported in this browser.");
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "CACHE_URLS", urls: [`/${locale}/emergency`] });
    navigator.serviceWorker.addEventListener("message", (e) => { if (e.data?.type === "CACHED") setMsg(t.savedOffline); }, { once: true });
    setMsg(t.savedOffline);
  };

  const downloadCard = () => {
    const lines = ["IRAQ TRAVEL — Emergency card", "", ...Object.entries(info).filter(([, v]) => v).map(([k, v]) => `${t.myInfoFields[k as keyof Info]}: ${v}`), "",
      ...(contacts.length ? contacts.map((c) => `${c.name}: ${c.phone ?? "—"}`) : ["No officially verified emergency numbers published yet — ask your hotel and embassy on arrival."])];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "iraq-travel-emergency-card.txt" });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="card grid gap-4 p-6 md:grid-cols-2">
      {(Object.keys(EMPTY) as (keyof Info)[]).map((k) => (
        <label key={k} className={k === "allergies" ? "md:col-span-2" : ""}>
          <span className="label">{t.myInfoFields[k]}</span>
          <input className="input" value={info[k]} onChange={(e) => setInfo((i) => ({ ...i, [k]: e.target.value }))} autoComplete="off" />
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-2 md:col-span-2">
        <button type="button" onClick={saveInfo} className="btn-river">{t.saveInfo}</button>
        <button type="button" onClick={saveOffline} className="btn-outline">{t.saveOffline}</button>
        <button type="button" onClick={downloadCard} className="btn-outline">{t.downloadCard}</button>
        {msg && <span role="status" className="text-sm text-emerald-700">{msg}</span>}
      </div>
    </div>
  );
}
