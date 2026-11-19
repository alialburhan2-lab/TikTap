import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";

export function navItems(locale: Locale, t: Dictionary) {
  const p = (s: string) => `/${locale}${s}`;
  return [
    { href: p("/destinations"), label: t.nav.destinations },
    { href: p("/heritage"), label: t.nav.heritage },
    { href: p("/planner"), label: t.nav.planner },
    { href: p("/hotels"), label: t.nav.hotels },
    { href: p("/restaurants"), label: t.nav.restaurants },
    { href: p("/prices"), label: t.nav.prices },
    { href: p("/transport"), label: t.nav.transport },
    { href: p("/map"), label: t.nav.map },
    { href: p("/safety"), label: t.nav.safety },
    { href: p("/protection"), label: t.nav.protection },
    { href: p("/emergency"), label: t.nav.emergency },
  ];
}

export function SiteHeader({ locale, t }: { locale: Locale; t: Dictionary }) {
  const items = navItems(locale, t);
  const primary = items.filter((i) => [t.nav.destinations, t.nav.planner, t.nav.hotels, t.nav.prices, t.nav.map, t.nav.safety].includes(i.label));
  return (
    <header className="sticky top-0 z-40 border-b border-river-900/10 bg-sand-50/85 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href={`/${locale}`} aria-label={`${t.brand.name} — ${t.nav.home}`}><Logo /></Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
          {primary.map((i) => (
            <Link key={i.href} href={i.href} className="rounded-full px-3 py-2 text-sm font-medium text-river-900 hover:bg-river-900/5">{i.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/emergency`} className="hidden rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 sm:inline-flex">SOS · {t.nav.emergency}</Link>
          <LanguageSwitcher locale={locale} label={t.nav.language} />
          <MobileNav items={items} label={t.nav.menu} />
        </div>
      </div>
    </header>
  );
}
