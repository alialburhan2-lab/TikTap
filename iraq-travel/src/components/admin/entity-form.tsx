"use client";

import { useActionState } from "react";
import { saveEntityAction, type AdminFormState } from "@/app/admin/actions";
import type { FieldDef } from "@/lib/admin/entities";
import { LOCALES, LOCALE_META } from "@/i18n/config";

type Props = {
  entity: string; id: string | null; fields: FieldDef[]; initial: Record<string, unknown>;
  refs: Record<string, { id: string; label: string }[]>; canVerify: boolean; canSetLevel: boolean;
};

const TRI = ["unknown", "yes", "no"];
const triValue = (v: unknown) => (v === true ? "yes" : v === false ? "no" : "unknown");
const toLocalInput = (iso: unknown) => (typeof iso === "string" && iso ? iso.slice(0, 16) : "");

export function EntityForm({ entity, id, fields, initial, refs, canVerify, canSetLevel }: Props) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveEntityAction.bind(null, entity, id), {});
  const err = (n: string) => state.errors?.[n] && <p className="mt-1 text-xs font-medium text-rose-700">{state.errors[n]}</p>;

  return (
    <form action={action} className="card mt-6 grid gap-5 p-6 md:grid-cols-2">
      {fields.map((f) => {
        const v = initial[f.name];
        const wide = ["textarea", "localized", "localizedLong", "images", "multiselect", "refs"].includes(f.type);
        const disabledLevel = f.guard === "providerLevel" && !canSetLevel;
        const label = <span className="label">{f.label}{f.required && " *"}</span>;
        let input: React.ReactNode;
        switch (f.type) {
          case "textarea":
            input = <textarea name={f.name} defaultValue={(v as string) ?? ""} rows={4} className="input" />;
            break;
          case "localized":
          case "localizedLong":
            input = (
              <div className="grid gap-2 md:grid-cols-2">
                {LOCALES.map((l) => {
                  const val = ((v as Record<string, string> | null) ?? {})[l] ?? "";
                  const common = { name: `${f.name}.${l}`, defaultValue: val, dir: LOCALE_META[l].dir, lang: LOCALE_META[l].htmlLang, className: "input", placeholder: LOCALE_META[l].label + (l === "en" ? " (required)" : "") };
                  return <label key={l} className="text-xs text-charcoal-600">{LOCALE_META[l].label}{f.type === "localizedLong" ? <textarea rows={3} {...common} /> : <input {...common} />}</label>;
                })}
              </div>
            );
            break;
          case "number":
            input = <input type="number" step="any" name={f.name} defaultValue={v == null ? "" : String(v)} className="input" />;
            break;
          case "boolean":
            input = <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={f.name} defaultChecked={!!v} /> {f.label}</label>;
            break;
          case "date":
            input = <input type="date" name={f.name} defaultValue={typeof v === "string" ? v.slice(0, 10) : ""} className="input" />;
            break;
          case "datetime":
            input = <input type="datetime-local" name={f.name} defaultValue={toLocalInput(v)} className="input" />;
            break;
          case "select": {
            const tri = f.options?.length === 3 && f.options.every((o) => TRI.includes(o));
            const current = tri ? triValue(v) : (v as string) ?? "";
            input = (
              <>
                <select name={f.name} defaultValue={current} className="input" disabled={disabledLevel}>
                  {!f.required && !tri && <option value="">—</option>}
                  {f.options!.map((o) => <option key={o} value={o} disabled={f.guard === "verificationStatus" && o === "verified" && !canVerify && current !== "verified"}>{o.replace(/_/g, " ")}</option>)}
                </select>
                {disabledLevel && <input type="hidden" name={f.name} value={current} />}
              </>
            );
            break;
          }
          case "multiselect":
          case "refs": {
            const opts = f.type === "refs" ? refs[f.ref!] ?? [] : f.options!.map((o) => ({ id: o, label: o.replace(/_/g, " ") }));
            const set = new Set((v as string[]) ?? []);
            input = (
              <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-xl border border-sand-300 bg-white p-3">
                {opts.map((o) => <label key={o.id} className="flex items-center gap-1.5 rounded-full bg-sand-100 px-3 py-1 text-xs"><input type="checkbox" name={f.name} value={o.id} defaultChecked={set.has(o.id)} />{o.label}</label>)}
              </div>
            );
            break;
          }
          case "ref":
            input = (
              <select name={f.name} defaultValue={(v as string) ?? ""} className="input">
                {(!f.required || !v) && <option value="">—</option>}
                {(refs[f.ref!] ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            );
            break;
          case "tags":
            input = <input name={f.name} defaultValue={Array.isArray(v) ? v.join(", ") : ""} className="input" />;
            break;
          case "images":
            input = <textarea name={f.name} defaultValue={(v as string) ?? ""} rows={4} className="input font-mono text-xs" placeholder="https://upload.wikimedia.org/... | Alt text | Author | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:... | yes" />;
            break;
          default:
            input = <input name={f.name} defaultValue={(v as string) ?? ""} className="input" />;
        }
        return (
          <div key={f.name} className={wide ? "md:col-span-2" : ""}>
            {f.type === "boolean" ? null : label}
            {input}
            {f.help && <p className="mt-1 text-xs text-charcoal-600">{f.help}</p>}
            {disabledLevel && <p className="mt-1 text-xs text-amber-800">Only verification officers can change this.</p>}
            {err(f.name)}
          </div>
        );
      })}
      <div className="flex items-center gap-3 md:col-span-2">
        <button className="btn-river" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        {state.message && <p role="alert" className="text-sm text-rose-700">{state.message}</p>}
      </div>
    </form>
  );
}
