import Link from "next/link";
import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/cards";
import { Notice } from "@/components/badges";
import { AdvisoryList } from "@/components/info";
import { ADVISORY_CATEGORIES } from "@/data/types";
import { getActiveAdvisories, listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "/safety", t.safety.title, t.safety.intro);
}

const OFFICIAL_LINKS = [
  { name: "United Kingdom — FCDO Foreign Travel Advice: Iraq", url: "https://www.gov.uk/foreign-travel-advice/iraq" },
  { name: "United States — Department of State Travel Advisories", url: "https://travel.state.gov/" },
  { name: "Iraq — Ministry of Culture, Tourism and Antiquities", url: "https://mota.gov.iq/" },
];

/** Static guidance that is general and not time-sensitive (reviewed English original). */
const GENERAL: Partial<Record<(typeof ADVISORY_CATEGORIES)[number], string>> = {
  entry_requirement: "Visa and entry rules for federal Iraq and the Kurdistan Region can differ and change. Confirm requirements with the official Iraqi government visa portal, an Iraqi embassy, or your government's travel advice before booking.",
  photography: "Do not photograph military, police, checkpoints, government buildings, airports, bridges or other infrastructure. Ask before photographing people, and follow signs at religious sites and museums.",
  insurance: "Check that your travel insurance covers Iraq — many policies exclude destinations under government advisories. Carry your policy number and 24-hour assistance line.",
  emergency_guidance: "Register with your embassy if your government offers a registration service. Keep copies of your passport and visa, and share your itinerary with someone at home.",
};

export default async function SafetyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const [active, all] = await Promise.all([getActiveAdvisories(), listPublic("safetyAdvisories")]);
  const official = active.filter((a) => a.kind === "official");
  const reports = all.filter((a) => a.kind === "user_report" && a.active);

  return (
    <>
      <PageHero eyebrow={t.nav.safety} title={t.safety.title} text={t.safety.intro} />
      <div className="container-x mt-10 space-y-4">
        {locale !== "en" && <Notice>{t.common.sensitiveEnglishOnly}</Notice>}
        {official.length === 0 && <Notice tone="warn"><strong>{t.common.verifyBefore}</strong></Notice>}
        <div className="card p-6">
          <h2 className="font-semibold text-river-900">{t.safety.checkOfficial}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {OFFICIAL_LINKS.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className="text-river-700 underline">{l.name} ↗</a></li>)}
          </ul>
        </div>
      </div>

      <section className="container-x mt-14">
        <SectionHeading title={t.safety.official} />
        <div className="grid gap-6 lg:grid-cols-2">
          {ADVISORY_CATEGORIES.map((c) => {
            const items = official.filter((a) => a.category === c);
            return (
              <div key={c} className="card p-6" id={c}>
                <h3 className="font-display mb-3 text-xl font-bold text-river-900">{t.safety.sections[c]}</h3>
                {GENERAL[c] && <p className="mb-3 text-sm text-charcoal-600" lang="en">{GENERAL[c]}</p>}
                <AdvisoryList advisories={items} locale={locale} t={t} />
              </div>
            );
          })}
          <div className="card p-6">
            <h3 className="font-display mb-3 text-xl font-bold text-river-900">{t.safety.embassies}</h3>
            <p className="text-sm text-charcoal-600">{t.safety.embassiesText}</p>
            <Link href={`/${locale}/emergency`} className="mt-3 inline-block text-sm font-semibold text-gold-700">{t.nav.emergency} →</Link>
          </div>
        </div>
      </section>

      <section className="container-x mt-14">
        <SectionHeading title={t.safety.userReports} text={t.safety.userReportsNote} />
        {reports.length === 0 ? <Notice>{t.common.noResults}</Notice> : <AdvisoryList advisories={reports} locale={locale} t={t} />}
      </section>
    </>
  );
}
