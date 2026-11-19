import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/store";
import { LOCALES, LOCALE_META } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import en from "@/i18n/dictionaries/en";

function countLeaves(o: unknown): number {
  return o && typeof o === "object" ? Object.values(o).reduce<number>((n, v) => n + countLeaves(v), 0) : 1;
}
function countTranslated(base: unknown, full: unknown): number {
  if (base && typeof base === "object") return Object.keys(base).reduce((n, k) => n + countTranslated((base as Record<string, unknown>)[k], (full as Record<string, unknown>)[k]), 0);
  return base !== full ? 1 : 0;
}

export default async function LanguagesPage() {
  await requireStaff();
  const [govs, sites] = await Promise.all([repo().list("governorates"), repo().list("touristSites")]);
  const totalUi = countLeaves(en);
  const rows = LOCALES.map((l) => {
    const ui = l === "en" ? totalUi : countTranslated(en, getDictionary(l));
    const names = sites.filter((s) => s.name[l]).length;
    const descs = sites.filter((s) => s.summary[l]).length;
    const govNames = govs.filter((g) => g.name[l]).length;
    return { l, ui, names, descs, govNames };
  });
  const missing = sites.filter((s) => !s.summary.ar || !s.name.ckb).slice(0, 30);
  const pct = (n: number, d: number) => `${Math.round((n / Math.max(1, d)) * 100)}%`;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-river-900">Languages</h1>
        <p className="text-sm text-charcoal-600">Coverage of the six supported languages. UI strings live in <code>src/i18n/dictionaries/*.ts</code>; content translations are edited on each record. Safety/legal texts stay in the reviewed English original until a reviewed translation exists.</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-sand-100 text-xs uppercase text-charcoal-600"><tr>{["Language", "Direction", "UI strings", "Governorate names", "Site names", "Site descriptions"].map((h) => <th key={h} className="px-4 py-2 text-start">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-sand-200">
            {rows.map((r) => (
              <tr key={r.l}>
                <td className="px-4 py-2 font-medium">{LOCALE_META[r.l].label} <span className="text-charcoal-600">({r.l})</span></td>
                <td className="px-4 py-2 uppercase">{LOCALE_META[r.l].dir}</td>
                <td className="px-4 py-2">{pct(r.ui, totalUi)}</td>
                <td className="px-4 py-2">{pct(r.govNames, govs.length)}</td>
                <td className="px-4 py-2">{pct(r.names, sites.length)}</td>
                <td className="px-4 py-2">{pct(r.descs, sites.length)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-charcoal-600">Kurdish (Sorani) UI strings are a draft and need native-speaker review. French, German and Spanish descriptions currently fall back to English with a visible notice.</p>
      {missing.length > 0 && (
        <section className="card p-6">
          <h2 className="font-semibold text-river-900">Sites missing Arabic description or Kurdish name</h2>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">{missing.map((s) => <li key={s.id}><Link href={`/admin/content/touristSites/${s.id}`} className="rounded-full bg-sand-100 px-3 py-1 hover:bg-sand-200">{s.name.en}</Link></li>)}</ul>
        </section>
      )}
    </div>
  );
}
