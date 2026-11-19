import type { Metadata } from "next";
import { LOCALES, LOCALE_META, type Locale } from "@/i18n/config";
import { siteUrl } from "@/lib/env";

/** Builds localized metadata with canonical + hreflang alternates for a path like "/destinations/ur". */
export function pageMetadata(locale: Locale, path: string, title: string, description: string, opts: { noindex?: boolean } = {}): Metadata {
  const base = siteUrl();
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[LOCALE_META[l].htmlLang] = `${base}/${l}${path}`;
  languages["x-default"] = `${base}/en${path}`;
  return {
    title,
    description,
    alternates: { canonical: `${base}/${locale}${path}`, languages },
    openGraph: {
      title, description, url: `${base}/${locale}${path}`, siteName: "IRAQ TRAVEL", type: "website", locale: LOCALE_META[locale].ogLocale,
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_META[l].ogLocale),
    },
    twitter: { card: "summary_large_image", title, description },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
  };
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
