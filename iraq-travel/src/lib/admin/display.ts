import "server-only";
import type { EntityName } from "@/data/types";
import { repo } from "@/lib/store";
import type { EntityConfig } from "./entities";

export function labelOf(rec: Record<string, unknown>): string {
  const n = rec.name ?? rec.title ?? rec.item ?? rec.email ?? rec.id;
  if (n && typeof n === "object") return String((n as { en?: string }).en ?? "");
  return String(n ?? "");
}

export async function refOptions(cfg: EntityConfig): Promise<Record<string, { id: string; label: string }[]>> {
  const refs = [...new Set(cfg.fields.filter((f) => f.ref).map((f) => f.ref as EntityName))];
  const out: Record<string, { id: string; label: string }[]> = {};
  for (const r of refs) {
    const list = await repo().list(r);
    out[r] = list.map((x) => ({ id: x.id, label: labelOf(x as unknown as Record<string, unknown>) })).sort((a, b) => a.label.localeCompare(b.label));
  }
  return out;
}

export function cell(value: unknown, refMap?: Map<string, string>): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((v) => (refMap?.get(String(v)) ?? String(v))).join(", ") || "—";
  if (typeof value === "object") return String((value as { en?: string }).en ?? JSON.stringify(value));
  const s = String(value);
  return refMap?.get(s) ?? (s.length > 80 ? `${s.slice(0, 80)}…` : s);
}
