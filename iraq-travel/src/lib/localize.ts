import type { LocalizedText } from "@/data/types";
import type { Locale } from "@/i18n/config";

/** Pick the localized string, falling back to English. `translated` tells the UI whether a fallback happened. */
export function tr(text: LocalizedText | null | undefined, locale: Locale): string {
  if (!text) return "";
  return text[locale] || text.en;
}

export function isTranslated(text: LocalizedText | null | undefined, locale: Locale): boolean {
  if (!text) return true;
  return locale === "en" || !!text[locale];
}

export function formatDate(iso: string | null | undefined, locale: Locale): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "ckb" ? "ar-IQ" : locale, { year: "numeric", month: "short", day: "numeric" }).format(d);
}

/** A record is considered outdated when it has not been verified/updated for this many days. */
export const STALE_AFTER_DAYS = 180;
export function isStale(iso: string | null | undefined, now = Date.now()): boolean {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) || now - t > STALE_AFTER_DAYS * 86_400_000;
}
