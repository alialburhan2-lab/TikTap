import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/cards";
import { Notice, StatusBadge } from "@/components/badges";
import { EmergencyOffline } from "@/components/emergency-offline";
import { EMERGENCY_KINDS } from "@/data/types";
import { getGovernorates, getSourcesById, listPublic } from "@/lib/queries";
import { resolveLocale } from "@/lib/page";
import { pageMetadata } from "@/lib/seo";
import { formatDate, tr } from "@/lib/localize";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return pageMetadata(locale, "/emergency", t.emergency.title, t.emergency.intro);
}

export default async function EmergencyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const [contacts, sources, governorates] = await Promise.all([listPublic("emergencyContacts"), getSourcesById(), getGovernorates()]);
  // Only verified (or partially verified) contacts with a source are shown publicly.
  const shown = contacts.filter((c) => (c.verificationStatus === "verified" || c.verificationStatus === "partially_verified") && c.sourceId);
  const gov = new Map(governorates.map((g) => [g.id, tr(g.name, locale)]));

  return (
    <>
      <PageHero eyebrow="SOS" title={t.emergency.title} text={t.emergency.intro} />
      <div className="container-x mt-10 space-y-4">
        {locale !== "en" && <Notice>{t.common.sensitiveEnglishOnly}</Notice>}
        {shown.length === 0 && <Notice tone="danger"><strong>{t.emergency.none}</strong> {t.emergency.noneAdvice} {t.common.verifyBefore}</Notice>}
      </div>
      {shown.length > 0 && (
        <section className="container-x mt-10">
          <div className="grid gap-6 md:grid-cols-2">
            {EMERGENCY_KINDS.map((k) => {
              const items = shown.filter((c) => c.kind === k);
              if (!items.length) return null;
              return (
                <div key={k} className="card p-6">
                  <h2 className="font-display mb-3 text-xl font-bold text-river-900">{t.emergency.kinds[k]}</h2>
                  <ul className="space-y-3">
                    {items.map((c) => {
                      const src = c.sourceId ? sources.get(c.sourceId) : null;
                      return (
                        <li key={c.id} className="rounded-xl bg-sand-100 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold">{c.name}{c.governorateId && <span className="text-sm font-normal text-charcoal-600"> · {gov.get(c.governorateId)}</span>}</p>
                            <StatusBadge status={c.verificationStatus} lastVerified={c.lastVerified} t={t} />
                          </div>
                          {c.phone && <a href={`tel:${c.phone}`} className="font-display mt-1 block text-3xl font-bold text-rose-700" dir="ltr">{c.phone}</a>}
                          {c.address && <p className="text-sm text-charcoal-600">{c.address}</p>}
                          <p className="mt-1 text-xs text-charcoal-600">{t.common.source}: {src ? <a href={src.url} className="underline" target="_blank" rel="noopener noreferrer">{src.name}</a> : "—"} · {t.common.lastVerified}: {formatDate(c.lastVerified, locale) ?? t.common.never}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <section className="container-x mt-14">
        <SectionHeading title={t.emergency.myInfo} />
        <EmergencyOffline t={t.emergency} locale={locale} contacts={shown.map((c) => ({ name: c.name, phone: c.phone }))} />
      </section>
    </>
  );
}
