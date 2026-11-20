/**
 * بنية اللغات: العربية هي اللغة الافتراضية.
 * لإضافة الإنجليزية لاحقاً: أضف "en" إلى locales، وأنشئ قاموس en.ts،
 * ثم انقل مسارات الموقع العام إلى app/[locale]/ (الحقل locale موجود مسبقاً في المقالات والتصنيفات).
 */
export const locales = ["ar"] as const;
export type Locale = (typeof locales)[number] | "en";
export const defaultLocale: Locale = "ar";

export const localeDir: Record<string, "rtl" | "ltr"> = { ar: "rtl", en: "ltr" };
