import { ar, type Dictionary } from "./ar";
import { defaultLocale, type Locale } from "./config";

const dictionaries: Partial<Record<Locale, Dictionary>> = { ar };

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] ?? ar;
}

export const t = getDictionary();
export * from "./config";
