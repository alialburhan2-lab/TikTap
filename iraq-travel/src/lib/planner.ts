/**
 * Smart Trip Planner engine (pure, runs in the browser and in tests).
 * All costs are derived from price records and carry their verification status;
 * missing data is reported as "not available" rather than invented.
 */
import type { Interest, PriceRecord, SafetyAdvisory, TouristSite, TransportRoute, VerificationStatus } from "@/data/types";
import { siteAccess } from "./access";
import { AVG_SPEED_KMH, estimatedRoadKm } from "./geo";
import { toIqd } from "./money";

export type PlannerSite = Pick<TouristSite, "id" | "slug" | "governorateId" | "lat" | "lng" | "interests" | "featured" | "recommendedVisitHours" | "accessStatus" | "entranceFee"> & { name: string };
export type PlannerGov = { id: string; slug: string; name: string; lat: number; lng: number };

export type BudgetLevel = "budget" | "mid_range" | "luxury";
export type TransportPref = "private_car" | "domestic_flight" | "train" | "mixed";

export interface PlannerInput {
  arrivalGovId: string;
  departureGovId: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: BudgetLevel;
  interests: Interest[];
  transport: TransportPref;
  hotelCategory: "budget" | "mid_range" | "luxury" | "family" | "boutique";
}

export interface PlannerData {
  sites: PlannerSite[];
  governorates: PlannerGov[];
  advisories: SafetyAdvisory[];
  prices: PriceRecord[];
  routes: TransportRoute[];
  iqdPerUsd: number;
}

export interface CostLine {
  amountIqd: number | null;
  /** Where the number came from; null amount means no usable price record exists. */
  basis: string;
  status: VerificationStatus | "not_available";
  demo: boolean;
}

export interface PlanStop { siteId: string; name: string; slug: string; visitHours: number; entranceFee: string | null }

export interface PlanDay {
  index: number;
  date: string;
  governorateId: string;
  governorateName: string;
  fromGovernorateId: string | null;
  travelKm: number;
  travelHours: number;
  stops: PlanStop[];
  costs: { transport: CostLine; hotel: CostLine; food: CostLine; entrance: CostLine };
  totalIqd: number;
  incomplete: boolean;
}

export interface PlanResult {
  days: PlanDay[];
  totalIqd: number;
  incomplete: boolean;
  excluded: { siteId: string; name: string; reason: string }[];
  warnings: string[];
  usesDemoData: boolean;
}

const MAX_DAYS = 21;
const DAY_VISIT_HOURS = 7;

export function tripLength(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0;
  return Math.min(MAX_DAYS, Math.round((e - s) / 86_400_000) + 1);
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function findPrice(prices: PriceRecord[], category: PriceRecord["category"], keyword?: string, govId?: string): PriceRecord | null {
  const pool = prices.filter((p) => p.published && p.category === category && (!keyword || p.item.toLowerCase().includes(keyword)));
  return pool.find((p) => p.governorateId === govId) ?? pool.find((p) => !p.governorateId) ?? pool[0] ?? null;
}

function line(rec: PriceRecord | null, qty: number, rate: number, label: string): CostLine {
  if (!rec) return { amountIqd: null, basis: `${label}: no price record available`, status: "not_available", demo: false };
  return {
    amountIqd: Math.round(toIqd(rec.avg, rec.currency, rate) * qty),
    basis: `${label}: average of "${rec.item}" (${rec.unit}) × ${qty}`,
    status: rec.verificationStatus,
    demo: !!rec.isDemo,
  };
}

function hotelKeyword(cat: PlannerInput["hotelCategory"], budget: BudgetLevel): string {
  const c = cat === "family" || cat === "boutique" ? budget : cat;
  return c === "budget" ? "budget" : c === "luxury" ? "luxury" : "mid-range";
}

/** Recompute the cost lines of one day (used after the visitor edits the plan). */
export function costDay(day: Omit<PlanDay, "costs" | "totalIqd" | "incomplete">, input: PlannerInput, data: PlannerData, isLastDay: boolean): PlanDay {
  const rate = data.iqdPerUsd;
  const rooms = Math.max(1, Math.ceil(input.travelers / 2));

  // Transport: intercity leg (route record or per-km estimate) + local taxis.
  let transport: CostLine;
  if (day.fromGovernorateId && day.fromGovernorateId !== day.governorateId) {
    const route = data.routes.find((r) => r.published && r.priceMinIqd != null && r.priceMaxIqd != null &&
      ((r.fromGovernorateId === day.fromGovernorateId && r.toGovernorateId === day.governorateId) || (r.toGovernorateId === day.fromGovernorateId && r.fromGovernorateId === day.governorateId)) &&
      (input.transport === "mixed" || r.mode === input.transport));
    if (route) {
      const cars = input.transport === "private_car" || route.mode === "private_car" ? Math.max(1, Math.ceil(input.travelers / 4)) : input.travelers;
      transport = { amountIqd: Math.round(((route.priceMinIqd! + route.priceMaxIqd!) / 2) * cars), basis: `Route record (${route.mode}) × ${cars}`, status: route.verificationStatus, demo: !!route.isDemo };
    } else {
      const perKm = findPrice(data.prices, "domestic_transport", "per km") ?? data.prices.find((p) => p.published && p.category === "domestic_transport" && p.unit.includes("km")) ?? null;
      const cars = Math.max(1, Math.ceil(input.travelers / 4));
      transport = perKm ? line(perKm, Math.round(day.travelKm) * cars, rate, "Intercity (estimated distance)") : { amountIqd: null, basis: "No intercity price record", status: "not_available", demo: false };
    }
  } else {
    const taxi = findPrice(data.prices, "taxi", undefined, day.governorateId);
    transport = line(taxi, 2 * Math.max(1, Math.ceil(input.travelers / 4)), rate, "Local taxis (2 trips)");
  }

  const hotelRec = findPrice(data.prices, "hotel", hotelKeyword(input.hotelCategory, input.budget), day.governorateId);
  const hotel: CostLine = isLastDay ? { amountIqd: 0, basis: "Departure day — no overnight stay", status: "estimated", demo: false } : line(hotelRec, rooms, rate, "Hotel");

  const mealRec = input.budget === "budget" ? findPrice(data.prices, "restaurant", "local") : findPrice(data.prices, "restaurant", "mid-range");
  const food = line(mealRec, input.travelers * (input.budget === "luxury" ? 3 : 2.5), rate, "Meals");

  const entrance: CostLine = day.stops.length === 0
    ? { amountIqd: 0, basis: "No site visits", status: "estimated", demo: false }
    : { amountIqd: null, basis: "Entrance fees not verified for these sites", status: "not_available", demo: false };

  const costs = { transport, hotel, food, entrance };
  const values = Object.values(costs);
  const totalIqd = values.reduce((s, c) => s + (c.amountIqd ?? 0), 0);
  const incomplete = values.some((c) => c.amountIqd == null);
  return { ...day, costs, totalIqd, incomplete };
}

export function summarize(days: PlanDay[]): { totalIqd: number; incomplete: boolean; usesDemoData: boolean } {
  return {
    totalIqd: days.reduce((s, d) => s + d.totalIqd, 0),
    incomplete: days.some((d) => d.incomplete),
    usesDemoData: days.some((d) => Object.values(d.costs).some((c) => c.demo)),
  };
}

export function scoreSite(site: PlannerSite, interests: Interest[]): number {
  const overlap = interests.length ? site.interests.filter((i) => interests.includes(i)).length : 1;
  return overlap * 10 + (site.featured ? 3 : 0);
}

export function buildPlan(input: PlannerInput, data: PlannerData): PlanResult {
  const nDays = tripLength(input.startDate, input.endDate);
  const warnings: string[] = [];
  const excluded: PlanResult["excluded"] = [];
  const govById = new Map(data.governorates.map((g) => [g.id, g]));
  if (nDays === 0) return { days: [], totalIqd: 0, incomplete: true, excluded, warnings: ["invalid_dates"], usesDemoData: false };

  const eligible: PlannerSite[] = [];
  for (const s of data.sites) {
    const decision = siteAccess(s, data.advisories);
    if (!decision.allowed) {
      excluded.push({ siteId: s.id, name: s.name, reason: decision.reason });
      continue;
    }
    if (s.accessStatus === "unknown") { /* included, but flagged globally below */ }
    eligible.push(s);
  }
  const blockedGov = (gid: string) => data.sites.some((s) => s.governorateId === gid) && !eligible.some((s) => s.governorateId === gid);
  if (blockedGov(input.arrivalGovId) || blockedGov(input.departureGovId)) warnings.push("arrival_or_departure_under_advisory");
  if (eligible.some((s) => s.accessStatus === "unknown")) warnings.push("access_unconfirmed");

  // Rank governorates by the interest score of their eligible sites.
  const scored = eligible.map((s) => ({ s, score: scoreSite(s, input.interests) })).filter((x) => x.score >= 10 || input.interests.length === 0);
  const govScore = new Map<string, number>();
  for (const { s, score } of scored) govScore.set(s.governorateId, (govScore.get(s.governorateId) ?? 0) + score);

  const maxGovs = Math.max(1, Math.min(Math.ceil(nDays / 2), govScore.size + 2));
  const chosen = new Set<string>([input.arrivalGovId]);
  const ranked = [...govScore.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  for (const g of ranked) {
    if (chosen.size >= maxGovs - (chosen.has(input.departureGovId) ? 0 : 1)) break;
    chosen.add(g);
  }
  chosen.add(input.departureGovId);

  // Nearest-neighbour ordering from arrival, forcing departure last.
  const order: string[] = [input.arrivalGovId];
  const remaining = [...chosen].filter((g) => g !== input.arrivalGovId && g !== input.departureGovId);
  while (remaining.length) {
    const cur = govById.get(order[order.length - 1])!;
    remaining.sort((a, b) => estimatedRoadKm(cur, govById.get(a)!) - estimatedRoadKm(cur, govById.get(b)!));
    order.push(remaining.shift()!);
  }
  if (input.departureGovId !== order[order.length - 1]) order.push(input.departureGovId);
  const route = order.length > nDays ? [...order.slice(0, nDays - 1), input.departureGovId].filter((g, i, a) => a.indexOf(g) === i) : order;

  // Allocate days to governorates by available site hours.
  const sitesByGov = new Map<string, PlannerSite[]>();
  for (const g of route) {
    sitesByGov.set(g, scored.filter((x) => x.s.governorateId === g).sort((a, b) => b.score - a.score).map((x) => x.s));
  }
  const alloc = route.map((g) => Math.max(1, Math.ceil((sitesByGov.get(g)!.reduce((h, s) => h + s.recommendedVisitHours, 0) || 1) / DAY_VISIT_HOURS)));
  let total = alloc.reduce((a, b) => a + b, 0);
  while (total > nDays) {
    const i = alloc.indexOf(Math.max(...alloc));
    if (alloc[i] === 1) break;
    alloc[i]--; total--;
  }
  let gi = 0;
  while (total < nDays) { alloc[gi % alloc.length]++; total++; gi++; }

  const raw: Omit<PlanDay, "costs" | "totalIqd" | "incomplete">[] = [];
  let dayIdx = 0;
  let prevGov: string | null = null;
  for (let r = 0; r < route.length && dayIdx < nDays; r++) {
    const gid = route[r];
    const gov = govById.get(gid)!;
    const queue = [...sitesByGov.get(gid)!];
    for (let k = 0; k < alloc[r] && dayIdx < nDays; k++) {
      const moving = k === 0 && prevGov !== null && prevGov !== gid;
      const km = moving ? estimatedRoadKm(govById.get(prevGov!)!, gov) : 0;
      const travelHours = km / AVG_SPEED_KMH;
      let hoursLeft = DAY_VISIT_HOURS - travelHours;
      const stops: PlanStop[] = [];
      while (queue.length && hoursLeft >= Math.min(queue[0].recommendedVisitHours, 1)) {
        const s = queue.shift()!;
        stops.push({ siteId: s.id, name: s.name, slug: s.slug, visitHours: s.recommendedVisitHours, entranceFee: s.entranceFee });
        hoursLeft -= s.recommendedVisitHours;
      }
      raw.push({ index: dayIdx, date: addDays(input.startDate, dayIdx), governorateId: gid, governorateName: gov.name, fromGovernorateId: moving ? prevGov : null, travelKm: Math.round(km), travelHours: Math.round(travelHours * 10) / 10, stops });
      dayIdx++;
      prevGov = gid;
    }
  }

  const days = raw.map((d, i) => costDay(d, input, data, i === raw.length - 1));
  const sum = summarize(days);
  if (sum.usesDemoData) warnings.push("uses_demo_data");
  if (sum.incomplete) warnings.push("incomplete_costs");
  return { days, ...sum, excluded, warnings };
}
