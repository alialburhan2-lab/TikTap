import Link from "next/link";

/** Server-rendered pill filters that update the query string (no JS required). */
export function FilterBar({ base, param, options, current, allLabel, keep = {} }: {
  base: string; param: string; options: { value: string; label: string }[]; current?: string; allLabel: string; keep?: Record<string, string | undefined>;
}) {
  const href = (v?: string) => {
    const qs = new URLSearchParams();
    for (const [k, val] of Object.entries(keep)) if (val) qs.set(k, val);
    if (v) qs.set(param, v);
    const s = qs.toString();
    return s ? `${base}?${s}` : base;
  };
  const pill = (active: boolean) => `rounded-full px-4 py-2 text-sm font-medium ring-1 transition ${active ? "bg-river-900 text-white ring-river-900" : "bg-white text-river-900 ring-river-900/15 hover:bg-sand-100"}`;
  return (
    <nav className="flex flex-wrap gap-2" aria-label={param}>
      <Link href={href(undefined)} className={pill(!current)} aria-current={!current ? "page" : undefined}>{allLabel}</Link>
      {options.map((o) => (
        <Link key={o.value} href={href(o.value)} className={pill(current === o.value)} aria-current={current === o.value ? "page" : undefined}>{o.label}</Link>
      ))}
    </nav>
  );
}
