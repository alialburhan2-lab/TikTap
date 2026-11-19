import type { BaseRecord, LocalizedText } from "./types";

export const SEED_DATE = "2026-11-19T00:00:00.000Z";

export function L(en: string, ar?: string, ckb?: string, fr?: string, de?: string, es?: string): LocalizedText {
  const t: LocalizedText = { en };
  if (ar) t.ar = ar;
  if (ckb) t.ckb = ckb;
  if (fr) t.fr = fr;
  if (de) t.de = de;
  if (es) t.es = es;
  return t;
}

export function base(id: string, extra: Partial<BaseRecord> = {}): BaseRecord {
  return { id, createdAt: SEED_DATE, updatedAt: SEED_DATE, published: true, ...extra };
}
