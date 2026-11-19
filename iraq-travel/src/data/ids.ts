/**
 * Deterministic UUID (RFC 4122 layout, version 5 nibble) derived from a readable seed key,
 * so seed data can reference each other by key ("baghdad") while the database uses UUIDs.
 * Pure JS (no Node crypto) so it runs anywhere. Not a cryptographic hash — IDs only.
 */
function fnv1a(str: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID_RE.test(s);

export function uid(key: string): string {
  if (isUuid(key)) return key.toLowerCase();
  const hex = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b].map((s) => fnv1a(key, s).toString(16).padStart(8, "0")).join("");
  const v = hex.split("");
  v[12] = "5";
  v[16] = ((parseInt(v[16], 16) & 0x3) | 0x8).toString(16);
  const h = v.join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

const ID_FIELD = /^(id|.*Id)$/;
const IDS_FIELD = /^.*Ids$/;

/** Convert every id / *Id / *Ids field of a seed record from a readable key to its UUID. */
export function withUuids<T extends object>(rec: T): T {
  const out = { ...rec } as Record<string, unknown>;
  for (const [k, v] of Object.entries(out)) {
    if (ID_FIELD.test(k) && typeof v === "string") out[k] = uid(v);
    else if (IDS_FIELD.test(k) && Array.isArray(v)) out[k] = v.map((x) => (typeof x === "string" ? uid(x) : x));
  }
  return out as T;
}
