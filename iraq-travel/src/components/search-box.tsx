import type { Governorate } from "@/data/types";
import { SITE_CATEGORIES } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";
import { tr } from "@/lib/localize";

/** Plain GET form (works without JavaScript). Results appear on the Destinations page. */
export function SearchBox({ locale, t, governorates, defaults = {} }: { locale: Locale; t: Dictionary; governorates: Governorate[]; defaults?: Record<string, string | undefined> }) {
  return (
    <form action={`/${locale}/destinations`} method="get" className="card grid gap-3 p-4 md:grid-cols-6 md:p-5">
      <div className="md:col-span-2">
        <label className="label" htmlFor="q">{t.common.destination}</label>
        <input id="q" name="q" defaultValue={defaults.q} className="input" placeholder="Ur, Babylon, Erbil…" />
      </div>
      <div>
        <label className="label" htmlFor="gov">{t.common.governorate}</label>
        <select id="gov" name="gov" defaultValue={defaults.gov ?? ""} className="input">
          <option value="">{t.common.any}</option>
          {governorates.map((g) => <option key={g.id} value={g.slug}>{tr(g.name, locale)}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="category">{t.common.category}</label>
        <select id="category" name="category" defaultValue={defaults.category ?? ""} className="input">
          <option value="">{t.common.any}</option>
          {SITE_CATEGORIES.map((c) => <option key={c} value={c}>{t.categories[c]}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="budget">{t.common.budget}</label>
          <select id="budget" name="budget" defaultValue={defaults.budget ?? ""} className="input">
            <option value="">{t.common.any}</option>
            <option value="budget">{t.planner.budgetLevels.budget}</option>
            <option value="mid_range">{t.planner.budgetLevels.mid_range}</option>
            <option value="luxury">{t.planner.budgetLevels.luxury}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="days">{t.common.days}</label>
          <input id="days" name="days" type="number" min={1} max={21} defaultValue={defaults.days} className="input" />
        </div>
      </div>
      <div className="flex items-end">
        <button className="btn-gold w-full" type="submit">{t.home.searchBtn}</button>
      </div>
    </form>
  );
}
