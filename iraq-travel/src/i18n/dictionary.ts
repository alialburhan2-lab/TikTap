import type { Locale } from "./config";
import en, { type Dictionary } from "./dictionaries/en";
import ar from "./dictionaries/ar";
import ckb from "./dictionaries/ckb";
import fr from "./dictionaries/fr";
import de from "./dictionaries/de";
import es from "./dictionaries/es";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type PartialDictionary = DeepPartial<Dictionary>;
export type { Dictionary };

function merge<T>(baseObj: T, over: DeepPartial<T> | undefined): T {
  if (!over) return baseObj;
  const out = { ...baseObj } as Record<string, unknown>;
  for (const [k, v] of Object.entries(over as object)) {
    const b = (baseObj as Record<string, unknown>)[k];
    out[k] = v && typeof v === "object" && b && typeof b === "object" ? merge(b, v as DeepPartial<typeof b>) : v ?? b;
  }
  return out as T;
}

const partials: Record<Locale, PartialDictionary> = { en: {}, ar, ckb, fr, de, es };
const cache = new Map<Locale, Dictionary>();

/** Full dictionary for a locale; untranslated strings fall back to English. */
export function getDictionary(locale: Locale): Dictionary {
  let d = cache.get(locale);
  if (!d) {
    d = merge(en, partials[locale]);
    cache.set(locale, d);
  }
  return d;
}

/** Simple {placeholder} interpolation. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
