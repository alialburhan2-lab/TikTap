import type { TransportProvider, TransportRoute } from "./types";
import { base } from "./helpers";

/** Real operators. Schedules, fares and durations are intentionally NOT entered until verified with the operator. */
export const transportProviders: TransportProvider[] = [
  { ...base("prov-iraqi-airways"), name: "Iraqi Airways", modes: ["domestic_flight"], website: "https://www.iqairways.com/", phone: null, notes: "National carrier. Check the official website for current domestic routes, schedules and fares.", providerLevel: "unverified", verificationStatus: "unverified", lastVerified: null },
  { ...base("prov-iraqi-railways"), name: "Iraqi Republic Railways", modes: ["train"], website: null, phone: null, notes: "State railway operator. Passenger service availability, timetables and fares must be confirmed locally.", providerLevel: "unverified", verificationStatus: "unverified", lastVerified: null },
];

function unverifiedRoute(id: string, mode: TransportRoute["mode"], from: string, to: string, providerId: string | null, notes: string): TransportRoute {
  return { ...base(id), mode, fromGovernorateId: from, toGovernorateId: to, providerId, priceMinIqd: null, priceMaxIqd: null, durationMinutes: null, departure: null, arrival: null, luggage: null, bookingMethod: providerId === "prov-iraqi-airways" ? "Official website or authorised agents" : null, notes, verificationStatus: "unverified", lastVerified: null };
}

export const transportRoutes: TransportRoute[] = [
  unverifiedRoute("route-flight-bgw-bsr", "domestic_flight", "baghdad", "basra", "prov-iraqi-airways", "Route listed for reference only — confirm operation, schedule and fare with the airline."),
  unverifiedRoute("route-flight-bgw-ebl", "domestic_flight", "baghdad", "erbil", "prov-iraqi-airways", "Route listed for reference only — confirm operation, schedule and fare with the airline."),
  unverifiedRoute("route-flight-bgw-isu", "domestic_flight", "baghdad", "sulaymaniyah", "prov-iraqi-airways", "Route listed for reference only — confirm operation, schedule and fare with the airline."),
  unverifiedRoute("route-flight-bgw-njf", "domestic_flight", "baghdad", "najaf", "prov-iraqi-airways", "Route listed for reference only — confirm operation, schedule and fare with the airline."),
  unverifiedRoute("route-train-bgw-bsr", "train", "baghdad", "basra", "prov-iraqi-railways", "Passenger rail service between Baghdad and Basra has operated in recent years; confirm the current timetable at the station."),
];

/** Airports & stations for the map (coordinates approximate). */
export const transportHubs = [
  { id: "hub-bgw", kind: "airport" as const, name: "Baghdad International Airport (BGW)", governorateId: "baghdad", lat: 33.2625, lng: 44.2346 },
  { id: "hub-bsr", kind: "airport" as const, name: "Basra International Airport (BSR)", governorateId: "basra", lat: 30.5491, lng: 47.6621 },
  { id: "hub-ebl", kind: "airport" as const, name: "Erbil International Airport (EBL)", governorateId: "erbil", lat: 36.2376, lng: 43.9632 },
  { id: "hub-isu", kind: "airport" as const, name: "Sulaymaniyah International Airport (ISU)", governorateId: "sulaymaniyah", lat: 35.5617, lng: 45.3167 },
  { id: "hub-njf", kind: "airport" as const, name: "Al Najaf International Airport (NJF)", governorateId: "najaf", lat: 31.99, lng: 44.4044 },
  { id: "hub-bgw-rail", kind: "railway" as const, name: "Baghdad Central Railway Station", governorateId: "baghdad", lat: 33.3077, lng: 44.3654 },
  { id: "hub-bsr-rail", kind: "railway" as const, name: "Basra (Ma'qal) Railway Station", governorateId: "basra", lat: 30.555, lng: 47.79 },
];
