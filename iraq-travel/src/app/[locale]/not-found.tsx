"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export default function NotFound() {
  const seg = (usePathname() ?? "").split("/")[1];
  const locale = isLocale(seg) ? seg : DEFAULT_LOCALE;
  const t = getDictionary(locale);
  return (
    <section className="container-x py-32 text-center">
      <p className="font-display text-7xl font-bold text-gold-500">404</p>
      <h1 className="font-display mt-4 text-3xl font-bold text-river-900">{t.notFound.title}</h1>
      <p className="mt-2 text-charcoal-600">{t.notFound.text}</p>
      <Link href={`/${locale}`} className="btn-river mt-8">{t.notFound.home}</Link>
    </section>
  );
}
