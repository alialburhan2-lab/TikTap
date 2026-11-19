import type { EntityMap, EntityName } from "@/data/types";

export interface Repository {
  readonly kind: "demo-file" | "supabase";
  list<K extends EntityName>(entity: K): Promise<EntityMap[K][]>;
  get<K extends EntityName>(entity: K, id: string): Promise<EntityMap[K] | null>;
  upsert<K extends EntityName>(entity: K, record: EntityMap[K]): Promise<EntityMap[K]>;
  remove<K extends EntityName>(entity: K, id: string): Promise<void>;
}

export const TABLES: Record<EntityName, string> = {
  governorates: "governorates",
  touristSites: "tourist_sites",
  hotels: "hotels",
  restaurants: "restaurants",
  restaurantMenus: "restaurant_menus",
  transportProviders: "transport_providers",
  transportRoutes: "transport_routes",
  tourGuides: "tour_guides",
  priceRecords: "price_records",
  safetyAdvisories: "safety_advisories",
  emergencyContacts: "emergency_contacts",
  officialSources: "official_sources",
  scamReports: "scam_reports",
  verificationDocuments: "verification_documents",
  reviews: "reviews",
  travelItineraries: "travel_itineraries",
  bookings: "bookings",
  contentUpdates: "content_updates",
  users: "users",
  adminLogs: "admin_logs",
};
