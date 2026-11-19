import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export type LocaleParams = Promise<{ locale: string }>;

/** Resolve and validate the [locale] segment and return its dictionary. */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<{ locale: Locale; t: ReturnType<typeof getDictionary> }> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, t: getDictionary(locale) };
}
