import Link from "next/link";
import { getNavCategories } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { t } from "@/i18n";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";

export async function Header() {
  const [settings, categories] = await Promise.all([getSettings(), getNavCategories()]);
  const links = [
    { href: "/", label: t.nav.home },
    { href: "/articles", label: t.nav.articles },
    ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
    { href: "/archive", label: t.nav.archive },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];
  const today = new Intl.DateTimeFormat("ar", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date());

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white md:bg-white/95 md:backdrop-blur">
      <div className="hidden bg-navy-900 text-xs text-navy-100 md:block">
        <div className="container-page flex h-8 items-center justify-between">
          <span>{today}</span>
          <span className="text-gold-300">{settings.siteTagline}</span>
        </div>
      </div>
      <div className="container-page flex h-18 items-center justify-between gap-4 py-3">
        <Logo name={settings.siteName} tagline={settings.siteTagline} />
        <div className="flex items-center gap-2">
          <form action="/search" className="hidden items-center lg:flex" role="search">
            <label htmlFor="header-q" className="sr-only">{t.nav.search}</label>
            <input id="header-q" name="q" type="search" placeholder={t.search.placeholder} className="input w-64 py-2" />
          </form>
          <Link href="/search" className="btn-outline px-3 lg:hidden" aria-label={t.nav.search}>
            <SearchIcon />
          </Link>
          <MobileNav links={links} />
        </div>
      </div>
      <nav aria-label="القائمة الرئيسية" className="hidden border-t border-line md:block">
        <ul className="container-page flex h-12 items-center gap-1 overflow-x-auto text-sm font-bold text-navy-900">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block rounded px-3 py-2 whitespace-nowrap transition hover:bg-gold-100 hover:text-navy-800">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
