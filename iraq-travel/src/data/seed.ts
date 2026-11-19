import type { Store } from "./types";
import { withUuids } from "./ids";
import { governorates } from "./governorates";
import { touristSites } from "./sites";
import { officialSources } from "./sources";
import { transportProviders, transportRoutes } from "./transport";
import { emergencyContacts, safetyAdvisories } from "./safety";
import { demoHotels, demoMenus, demoPrices, demoRestaurants, demoReviews, demoRoutes, demoScamReports, demoTourGuides } from "./demo";

export function buildSeedStore(): Store {
  const raw: Store = {
    governorates,
    touristSites,
    hotels: demoHotels,
    restaurants: demoRestaurants,
    restaurantMenus: demoMenus,
    transportProviders,
    transportRoutes: [...transportRoutes, ...demoRoutes],
    tourGuides: demoTourGuides,
    priceRecords: demoPrices,
    safetyAdvisories,
    emergencyContacts,
    officialSources,
    scamReports: demoScamReports,
    verificationDocuments: [],
    reviews: demoReviews,
    travelItineraries: [],
    bookings: [],
    contentUpdates: [],
    users: [],
    adminLogs: [],
  };
  const out = {} as Record<string, unknown[]>;
  for (const [k, list] of Object.entries(raw)) out[k] = (list as object[]).map((r) => withUuids(structuredClone(r)));
  return out as unknown as Store;
}
