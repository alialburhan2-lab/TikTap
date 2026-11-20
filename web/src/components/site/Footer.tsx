import Link from "next/link";
import { getNavCategories } from "@/lib/articles";
import { getSettings, socialLinks } from "@/lib/settings";
import { t } from "@/i18n";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

const SOCIAL_LABELS: Record<string, string> = {
  x: "X (تويتر)",
  facebook: "فيسبوك",
  instagram: "إنستغرام",
  youtube: "يوتيوب",
  telegram: "تيليغرام",
  linkedin: "لينكدإن",
};

export async function Footer() {
  const [settings, categories] = await Promise.all([getSettings(), getNavCategories()]);
  const social = Object.entries(socialLinks(settings)).filter(([, v]) => !!v);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-navy-900 text-navy-100">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo name={settings.siteName} tagline={settings.siteTagline} light />
          <p className="text-sm leading-7 text-navy-100/80">{settings.footerText || settings.siteDescription}</p>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-extrabold text-gold-500">{t.footer.sections}</h2>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link className="hover:text-gold-300" href={`/category/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-extrabold text-gold-500">{t.footer.platform}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-gold-300" href="/articles">{t.nav.articles}</Link></li>
            <li><Link className="hover:text-gold-300" href="/archive">{t.nav.archive}</Link></li>
            <li><Link className="hover:text-gold-300" href="/about">{t.nav.about}</Link></li>
            <li><Link className="hover:text-gold-300" href="/contact">{t.nav.contact}</Link></li>
            <li><Link className="hover:text-gold-300" href="/search">{t.nav.search}</Link></li>
          </ul>
          {social.length > 0 && (
            <>
              <h2 className="mt-6 mb-3 text-sm font-extrabold text-gold-500">{t.footer.follow}</h2>
              <ul className="flex flex-wrap gap-2 text-xs">
                {social.map(([k, v]) => (
                  <li key={k}>
                    <a href={v} target="_blank" rel="noopener noreferrer" className="rounded border border-navy-700 px-2.5 py-1 hover:border-gold-500 hover:text-gold-300">
                      {SOCIAL_LABELS[k] ?? k}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        {settings.newsletterEnabled && (
          <div>
            <h2 className="mb-2 text-sm font-extrabold text-gold-500">{t.newsletter.title}</h2>
            <p className="mb-4 text-sm text-navy-100/80">{t.newsletter.text}</p>
            <NewsletterForm variant="dark" />
          </div>
        )}
      </div>
      <div className="border-t border-navy-800">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-navy-100/70 sm:flex-row">
          <p>© {year} {settings.siteName} — {t.footer.rights}</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gold-300">{t.footer.privacy}</Link>
            <Link href="/terms" className="hover:text-gold-300">{t.footer.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
