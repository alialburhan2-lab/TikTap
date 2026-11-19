/**
 * ⚠️ DEMO DATA — NOT REAL.
 * Every record in this file has `isDemo: true` and is rendered with a "DEMO" badge.
 * Names are fictional placeholders, contact fields are empty, and prices are illustrative
 * only so the Fair Price system, filters and trip planner can be exercised before real,
 * verified records are entered through the admin dashboard.
 * Hide all of it with NEXT_PUBLIC_SHOW_DEMO_DATA=false.
 */
import type { Hotel, PriceRecord, Restaurant, RestaurantMenuItem, Review, ScamReport, TourGuide, TransportRoute } from "./types";
import { base } from "./helpers";

const demo = (id: string) => base(id, { isDemo: true });
const DEMO_NOTE = "DEMO — illustrative sample value, not real market data";

function hotel(id: string, name: string, gov: string, city: string, category: Hotel["category"], lat: number, lng: number, min: number, max: number): Hotel {
  return {
    ...demo(id), slug: id, name: `[DEMO] ${name}`, governorateId: gov, city, category, address: null, lat, lng,
    phone: null, whatsapp: null, roomPriceMinUsd: min, roomPriceMaxUsd: max, breakfast: null, wifi: null, airConditioning: null, parking: null,
    facilities: [], cancellationPolicy: null, bookingContact: null, images: [], providerLevel: "unverified", verificationStatus: "unverified", lastVerified: null,
  };
}

export const demoHotels: Hotel[] = [
  hotel("demo-hotel-tigris", "Tigris Riverside Hotel", "baghdad", "Baghdad", "luxury", 33.312, 44.40, 150, 260),
  hotel("demo-hotel-karrada", "Karrada Family Suites", "baghdad", "Baghdad", "family", 33.305, 44.425, 70, 120),
  hotel("demo-hotel-citadel", "Citadel View Boutique", "erbil", "Erbil", "boutique", 36.19, 44.012, 90, 150),
  hotel("demo-hotel-ankawa", "Ankawa Budget Inn", "erbil", "Erbil", "budget", 36.23, 43.995, 30, 50),
  hotel("demo-hotel-nasiriyah", "Euphrates Mid-Range Hotel", "dhi-qar", "Nasiriyah", "mid_range", 31.045, 46.26, 45, 80),
  hotel("demo-hotel-hillah", "Hillah Guesthouse", "babylon", "Hillah", "budget", 32.47, 44.42, 25, 45),
  hotel("demo-hotel-basra", "Shatt Corniche Hotel", "basra", "Basra", "mid_range", 30.51, 47.83, 60, 110),
  hotel("demo-hotel-slemani", "Azmar Mountain Lodge", "sulaymaniyah", "Sulaymaniyah", "boutique", 35.57, 45.43, 70, 130),
  hotel("demo-hotel-najaf", "Old City Pilgrim Hotel", "najaf", "Najaf", "budget", 31.995, 44.318, 25, 60),
];

function restaurant(id: string, name: string, gov: string, city: string, categories: Restaurant["categories"], lat: number, lng: number, avg: number): Restaurant {
  return {
    ...demo(id), slug: id, name: `[DEMO] ${name}`, governorateId: gov, city, categories, address: null, lat, lng, openingHours: null, contact: null,
    dietary: categories.includes("halal") ? ["halal (unverified)"] : [], averageCostIqd: avg, images: [], providerLevel: "unverified", verificationStatus: "unverified", lastVerified: null,
  };
}

export const demoRestaurants: Restaurant[] = [
  restaurant("demo-rest-masgouf", "Riverside Masgouf House", "baghdad", "Baghdad", ["iraqi_traditional", "halal", "family"], 33.318, 44.395, 25000),
  restaurant("demo-rest-kahi", "Morning Kahi & Geymar", "baghdad", "Baghdad", ["iraqi_traditional", "desserts", "halal"], 33.338, 44.39, 6000),
  restaurant("demo-rest-erbil-cafe", "Citadel Tea House", "erbil", "Erbil", ["cafe"], 36.191, 44.011, 5000),
  restaurant("demo-rest-dolma", "Mother's Dolma Kitchen", "sulaymaniyah", "Sulaymaniyah", ["iraqi_traditional", "vegetarian", "halal"], 35.562, 45.44, 15000),
  restaurant("demo-rest-basra-fish", "Gulf Fish Grill", "basra", "Basra", ["iraqi_traditional", "family", "halal"], 30.51, 47.81, 20000),
  restaurant("demo-rest-fine", "Mesopotamia Fine Dining", "erbil", "Erbil", ["fine_dining", "international"], 36.2, 44.0, 45000),
];

export const demoMenus: RestaurantMenuItem[] = [
  { ...demo("demo-menu-1"), restaurantId: "demo-rest-masgouf", name: "Masgouf (grilled carp), per kg", description: "Sample item", priceIqd: 30000, verificationStatus: "unverified", lastVerified: null },
  { ...demo("demo-menu-2"), restaurantId: "demo-rest-masgouf", name: "Timman & margat (rice and stew)", description: "Sample item", priceIqd: 10000, verificationStatus: "unverified", lastVerified: null },
  { ...demo("demo-menu-3"), restaurantId: "demo-rest-kahi", name: "Kahi with geymar and date syrup", description: "Sample item", priceIqd: 4000, verificationStatus: "unverified", lastVerified: null },
  { ...demo("demo-menu-4"), restaurantId: "demo-rest-dolma", name: "Dolma plate", description: "Sample item", priceIqd: 12000, verificationStatus: "unverified", lastVerified: null },
];

function price(id: string, category: PriceRecord["category"], item: string, gov: string | null, min: number, avg: number, max: number, currency: "IQD" | "USD", unit: string): PriceRecord {
  return { ...demo(id), category, item, governorateId: gov, city: null, provider: null, min, avg, max, currency, unit, sourceId: null, sourceNote: DEMO_NOTE, lastUpdated: "2026-11-19", verificationStatus: "unverified" };
}

export const demoPrices: PriceRecord[] = [
  price("demo-price-meal-local", "restaurant", "Meal at a local restaurant", null, 5000, 10000, 20000, "IQD", "per person"),
  price("demo-price-meal-mid", "restaurant", "Three-course meal, mid-range restaurant", null, 20000, 35000, 60000, "IQD", "per person"),
  price("demo-price-tea", "restaurant", "Glass of tea (chai) at a café", null, 500, 1000, 2000, "IQD", "per glass"),
  price("demo-price-hotel-budget", "hotel", "Budget hotel room", null, 25, 40, 60, "USD", "per night"),
  price("demo-price-hotel-mid", "hotel", "Mid-range hotel room", null, 50, 80, 120, "USD", "per night"),
  price("demo-price-hotel-lux", "hotel", "Luxury hotel room", null, 120, 180, 300, "USD", "per night"),
  price("demo-price-taxi-city", "taxi", "Taxi ride within a city (short)", null, 3000, 6000, 12000, "IQD", "per trip"),
  price("demo-price-driver-day", "private_driver", "Private car with driver", null, 60, 90, 150, "USD", "per day"),
  price("demo-price-intercity-km", "domestic_transport", "Private car, intercity", null, 300, 450, 700, "IQD", "per km"),
  price("demo-price-guide-day", "tour_guide", "Licensed tour guide", null, 50, 80, 150, "USD", "per day"),
  price("demo-price-boat-marsh", "activity", "Boat trip in the marshes", "dhi-qar", 20000, 35000, 60000, "IQD", "per boat"),
];

export const demoTourGuides: TourGuide[] = [
  { ...demo("demo-guide-1"), name: "[DEMO] Sample Heritage Guide", kind: "guide", languages: ["English", "Arabic"], governorateIds: ["baghdad", "babylon"], phone: null, licenseNumber: null, providerLevel: "unverified", verificationStatus: "unverified", lastVerified: null },
  { ...demo("demo-guide-2"), name: "[DEMO] Sample Kurdistan Tours Agency", kind: "agency", languages: ["English", "Kurdish", "Arabic"], governorateIds: ["erbil", "duhok", "sulaymaniyah"], phone: null, licenseNumber: null, providerLevel: "unverified", verificationStatus: "unverified", lastVerified: null },
  { ...demo("demo-guide-3"), name: "[DEMO] Sample Southern Driver", kind: "driver", languages: ["Arabic", "English"], governorateIds: ["dhi-qar", "basra", "maysan"], phone: null, licenseNumber: null, providerLevel: "unverified", verificationStatus: "unverified", lastVerified: null },
];

function road(id: string, from: string, to: string, min: number, max: number, minutes: number): TransportRoute {
  return {
    ...demo(id), mode: "private_car", fromGovernorateId: from, toGovernorateId: to, providerId: null, priceMinIqd: min, priceMaxIqd: max, durationMinutes: minutes,
    departure: "Flexible (private hire)", arrival: null, luggage: "Car boot", bookingMethod: "Arrange with a vetted driver or hotel", notes: DEMO_NOTE, verificationStatus: "unverified", lastVerified: null,
  };
}

export const demoRoutes: TransportRoute[] = [
  road("demo-route-bgw-hillah", "baghdad", "babylon", 60000, 100000, 120),
  road("demo-route-bgw-karbala", "baghdad", "karbala", 70000, 110000, 150),
  road("demo-route-bgw-najaf", "baghdad", "najaf", 80000, 130000, 180),
  road("demo-route-najaf-nasiriyah", "najaf", "dhi-qar", 100000, 160000, 240),
  road("demo-route-nasiriyah-basra", "dhi-qar", "basra", 80000, 130000, 150),
  road("demo-route-erbil-slemani", "erbil", "sulaymaniyah", 70000, 110000, 150),
  road("demo-route-erbil-duhok", "erbil", "duhok", 70000, 110000, 150),
];

export const demoReviews: Review[] = [
  { ...demo("demo-review-1"), targetType: "hotel", targetId: "demo-hotel-citadel", rating: 4, title: "[DEMO] Sample review", body: "This is a placeholder review to demonstrate moderation. It is not a real guest review.", authorName: "Demo user", status: "approved" },
  { ...demo("demo-review-2"), targetType: "restaurant", targetId: "demo-rest-masgouf", rating: 5, title: "[DEMO] Pending sample review", body: "Placeholder awaiting moderation.", authorName: "Demo user", status: "pending" },
];

export const demoScamReports: ScamReport[] = [
  { ...demo("demo-report-1"), published: false, type: "overcharging", providerName: "[DEMO] Sample taxi", providerType: "taxi", governorateId: "baghdad", description: "Demo complaint showing the review workflow. Not a real report.", amountPaid: "30,000 IQD", expectedAmount: "10,000 IQD", incidentDate: "2026-11-01", contactEmail: null, status: "new", actions: [] },
];
