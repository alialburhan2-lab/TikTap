import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site-url";
import { defaultLocale, localeDir } from "@/i18n/config";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#172A38",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = `${s.siteName} | المنصة الرسمية`;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s | ${s.siteName}` },
    description: s.siteDescription,
    applicationName: s.siteName,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "ar_AR",
      siteName: s.siteName,
      title,
      description: s.siteDescription,
      url: siteUrl(),
    },
    twitter: { card: "summary_large_image", title, description: s.siteDescription },
    icons: { icon: "/icon.svg" },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={defaultLocale} dir={localeDir[defaultLocale]}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
