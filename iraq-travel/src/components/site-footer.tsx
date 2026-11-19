import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { Logo } from "./logo";

export function SiteFooter({ locale, t }: { locale: Locale; t: Dictionary }) {
  const p = (s: string) => `/${locale}${s}`;
  const cols = [
    { title: t.footer.explore, links: [[t.nav.destinations, "/destinations"], [t.nav.heritage, "/heritage"], [t.nav.map, "/map"], [t.nav.restaurants, "/restaurants"]] },
    { title: t.footer.plan, links: [[t.nav.planner, "/planner"], [t.nav.hotels, "/hotels"], [t.nav.transport, "/transport"], [t.nav.prices, "/prices"]] },
    { title: t.footer.safety, links: [[t.nav.safety, "/safety"], [t.nav.protection, "/protection"], [t.nav.emergency, "/emergency"], [t.nav.sources, "/sources"]] },
  ];
  return (
    <footer className="mt-24 bg-river-950 text-sand-200">
      <div className="h-1 bg-gradient-to-r from-gold-700 via-gold-400 to-gold-700" />
      <div className="container-x grid gap-10 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo light tagline={t.brand.tagline} />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-sand-300">{t.footer.about}</p>
          <div className="mt-6 rounded-xl bg-white/5 p-4 text-xs leading-relaxed text-sand-300 ring-1 ring-white/10">
            <p className="mb-1 font-semibold text-gold-300">{t.footer.data}</p>
            {t.footer.dataText}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h2 className="eyebrow mb-4 text-gold-300">{c.title}</h2>
            <ul className="space-y-2 text-sm">
              {c.links.map(([label, href]) => (
                <li key={href}><Link href={p(href)} className="hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-start justify-between gap-2 py-5 text-xs text-sand-300 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} IRAQ TRAVEL. {t.footer.rights} · <a className="underline hover:text-white" href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer" target="_blank">{t.footer.osm}</a></p>
          <Link href="/admin/login" className="hover:text-white" rel="nofollow">{t.footer.admin}</Link>
        </div>
      </div>
    </footer>
  );
}
