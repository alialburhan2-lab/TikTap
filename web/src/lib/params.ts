export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function str(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.length <= 200 ? s : undefined;
}

export function pageParam(v: string | string[] | undefined): number {
  const n = Number(str(v));
  return Number.isFinite(n) && n >= 1 && n <= 10_000 ? Math.floor(n) : 1;
}

export function dateParam(v: string | string[] | undefined): Date | undefined {
  const s = str(v);
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
