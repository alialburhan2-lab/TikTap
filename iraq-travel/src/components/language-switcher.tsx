"use client";

import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_META, switchLocalePath, type Locale } from "@/i18n/config";

/** Changes language while staying on the same page (keeps the query string and hash). */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() || `/${locale}`;
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        className="cursor-pointer appearance-none rounded-full border border-river-900/15 bg-white py-1.5 ps-3 pe-8 text-sm font-medium text-river-900 hover:bg-sand-100"
        value={locale}
        onChange={(e) => {
          const next = e.target.value as Locale;
          document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
          window.location.assign(switchLocalePath(pathname, next) + window.location.search + window.location.hash);
        }}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={LOCALE_META[l].htmlLang}>{LOCALE_META[l].native}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute end-3 text-xs text-river-900" aria-hidden>▾</span>
    </label>
  );
}
