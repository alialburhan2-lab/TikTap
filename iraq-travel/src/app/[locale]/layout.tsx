import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { isLocale, LOCALES, LOCALE_META } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteUrl } from "@/lib/env";
import { JsonLd } from "@/lib/seo";
import { ServiceWorkerRegistrar } from "@/components/sw-registrar";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(isLocale(locale) ? locale : "en");
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${t.brand.name} — ${t.brand.tagline}`, template: `%s · ${t.brand.name}` },
    description: t.home.heroText,
    applicationName: "IRAQ TRAVEL",
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = { themeColor: "#0f2a4a", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const meta = LOCALE_META[locale];
  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <body className="min-h-screen">
        <a href="#main" className="skip-link">Skip to content</a>
        <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: "IRAQ TRAVEL", url: `${siteUrl()}/${locale}`, inLanguage: meta.htmlLang, slogan: t.brand.tagline }} />
        <SiteHeader locale={locale} t={t} />
        <main id="main">{children}</main>
        <SiteFooter locale={locale} t={t} />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
