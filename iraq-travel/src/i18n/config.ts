export const LOCALES = ["en", "ar", "ckb", "fr", "de", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_META: Record<Locale, { label: string; native: string; dir: "ltr" | "rtl"; htmlLang: string; ogLocale: string }> = {
  en: { label: "English", native: "English", dir: "ltr", htmlLang: "en", ogLocale: "en_US" },
  ar: { label: "Arabic", native: "العربية", dir: "rtl", htmlLang: "ar", ogLocale: "ar_IQ" },
  ckb: { label: "Kurdish (Sorani)", native: "کوردی", dir: "rtl", htmlLang: "ckb", ogLocale: "ckb_IQ" },
  fr: { label: "French", native: "Français", dir: "ltr", htmlLang: "fr", ogLocale: "fr_FR" },
  de: { label: "German", native: "Deutsch", dir: "ltr", htmlLang: "de", ogLocale: "de_DE" },
  es: { label: "Spanish", native: "Español", dir: "ltr", htmlLang: "es", ogLocale: "es_ES" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** Swap the locale segment of a pathname, keeping the rest of the page path. */
export function switchLocalePath(pathname: string, next: Locale): string {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) parts[1] = next;
  else parts.splice(1, 0, next);
  return parts.join("/") || `/${next}`;
}
