import {
  ADVISORY_CATEGORIES, ADVISORY_LEVELS, EMERGENCY_KINDS, HOTEL_CATEGORIES, INTERESTS, PRICE_CATEGORIES, PROVIDER_LEVELS, REPORT_STATUSES, REPORT_TYPES,
  RESTAURANT_CATEGORIES, SITE_CATEGORIES, TRANSPORT_MODES, VERIFICATION_STATUSES, type EntityName,
} from "@/data/types";

export type FieldType =
  | "text" | "textarea" | "number" | "boolean" | "date" | "datetime" | "select" | "multiselect"
  | "localized" | "localizedLong" | "tags" | "images" | "ref" | "refs";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
  ref?: EntityName;
  required?: boolean;
  nullable?: boolean;
  help?: string;
  /** Hidden from roles that may not change it (enforced again server-side). */
  guard?: "providerLevel" | "verificationStatus";
}

export interface EntityConfig {
  name: EntityName;
  label: string;
  group: "Content" | "Commerce" | "Safety" | "Trust";
  fields: FieldDef[];
  columns: string[];
  slugFrom?: string;
}

const status: FieldDef = { name: "verificationStatus", label: "Data status", type: "select", options: VERIFICATION_STATUSES, required: true, guard: "verificationStatus" };
const lastVerified: FieldDef = { name: "lastVerified", label: "Last verified", type: "date", nullable: true };
const published: FieldDef = { name: "published", label: "Published", type: "boolean" };
const isDemo: FieldDef = { name: "isDemo", label: "Demo record (shows DEMO badge)", type: "boolean" };
const providerLevel: FieldDef = { name: "providerLevel", label: "Provider verification level", type: "select", options: PROVIDER_LEVELS, required: true, guard: "providerLevel", help: "Raised only by verification officers after an approved document review." };
const images: FieldDef = { name: "images", label: "Photos", type: "images", help: "One per line: url | alt | credit | license | source page URL | verified (yes/no). Only photos confirmed to show this exact place may be marked verified." };
const gov: FieldDef = { name: "governorateId", label: "Governorate", type: "ref", ref: "governorates", required: true };
const lat: FieldDef = { name: "lat", label: "Latitude", type: "number", nullable: true };
const lng: FieldDef = { name: "lng", label: "Longitude", type: "number", nullable: true };

export const ENTITIES: Partial<Record<EntityName, EntityConfig>> = {
  governorates: {
    name: "governorates", label: "Governorates", group: "Content", slugFrom: "name", columns: ["name", "region", "verificationStatus", "published"],
    fields: [
      { name: "slug", label: "URL slug", type: "text", required: true }, { name: "name", label: "Name", type: "localized", required: true },
      { name: "region", label: "Region", type: "select", options: ["federal", "kurdistan_region"], required: true }, { name: "capital", label: "Capital", type: "localized", required: true },
      { name: "summary", label: "Summary", type: "localizedLong", required: true }, { name: "history", label: "Historical background", type: "localizedLong" },
      { name: "geography", label: "Geography", type: "localizedLong" }, { name: "bestTimeToVisit", label: "Best time to visit", type: "localizedLong" },
      { ...lat, nullable: false, required: true }, { ...lng, nullable: false, required: true }, images, { name: "sourceIds", label: "Sources", type: "refs", ref: "officialSources" }, status, lastVerified, published,
    ],
  },
  touristSites: {
    name: "touristSites", label: "Tourist sites", group: "Content", slugFrom: "name", columns: ["name", "governorateId", "categories", "verificationStatus", "published"],
    fields: [
      { name: "slug", label: "URL slug", type: "text", required: true }, gov, { name: "name", label: "Name", type: "localized", required: true },
      { name: "categories", label: "Categories", type: "multiselect", options: SITE_CATEGORIES, required: true }, { name: "interests", label: "Planner interests", type: "multiselect", options: INTERESTS },
      { name: "summary", label: "Description", type: "localizedLong", required: true }, { name: "history", label: "Historical background", type: "localizedLong" },
      { ...lat, nullable: false, required: true }, { ...lng, nullable: false, required: true }, { name: "coordinatesApproximate", label: "Coordinates approximate", type: "boolean" },
      images,
      { name: "openingHours", label: "Opening hours", type: "text", nullable: true, help: "Leave empty unless confirmed — the site shows “Opening hours not confirmed”." },
      { name: "entranceFee", label: "Entrance fee", type: "text", nullable: true, help: "Leave empty unless verified — the site shows “Price not verified”." },
      { name: "visitorRestrictions", label: "Visitor restrictions", type: "textarea", nullable: true }, { name: "accessibility", label: "Accessibility", type: "textarea", nullable: true },
      { name: "accessStatus", label: "Access status", type: "select", options: ["open", "restricted", "closed", "unknown"], required: true, help: "restricted/closed excludes the site from generated itineraries." },
      { name: "recommendedVisitHours", label: "Recommended visit (hours)", type: "number", required: true }, { name: "featured", label: "Featured on homepage", type: "boolean" },
      { name: "sourceIds", label: "Official sources", type: "refs", ref: "officialSources" }, status, lastVerified, published,
    ],
  },
  hotels: {
    name: "hotels", label: "Hotels", group: "Commerce", slugFrom: "name", columns: ["name", "city", "category", "providerLevel", "verificationStatus", "published"],
    fields: [
      { name: "slug", label: "URL slug", type: "text", required: true }, { name: "name", label: "Name", type: "text", required: true }, gov, { name: "city", label: "City", type: "text", required: true },
      { name: "category", label: "Category", type: "select", options: HOTEL_CATEGORIES, required: true }, { name: "address", label: "Address", type: "text", nullable: true }, lat, lng,
      { name: "phone", label: "Phone", type: "text", nullable: true, help: "Only enter numbers confirmed with the hotel." }, { name: "whatsapp", label: "WhatsApp", type: "text", nullable: true },
      { name: "roomPriceMinUsd", label: "Room price min (USD)", type: "number", nullable: true }, { name: "roomPriceMaxUsd", label: "Room price max (USD)", type: "number", nullable: true },
      { name: "breakfast", label: "Breakfast", type: "select", options: ["unknown", "yes", "no"] }, { name: "wifi", label: "Wi-Fi", type: "select", options: ["unknown", "yes", "no"] },
      { name: "airConditioning", label: "Air conditioning", type: "select", options: ["unknown", "yes", "no"] }, { name: "parking", label: "Parking", type: "select", options: ["unknown", "yes", "no"] },
      { name: "facilities", label: "Facilities (comma separated)", type: "tags" }, { name: "cancellationPolicy", label: "Cancellation policy", type: "textarea", nullable: true },
      { name: "bookingContact", label: "Booking contact", type: "text", nullable: true }, images, providerLevel, status, lastVerified, isDemo, published,
    ],
  },
  restaurants: {
    name: "restaurants", label: "Restaurants", group: "Commerce", slugFrom: "name", columns: ["name", "city", "categories", "providerLevel", "verificationStatus", "published"],
    fields: [
      { name: "slug", label: "URL slug", type: "text", required: true }, { name: "name", label: "Name", type: "text", required: true }, gov, { name: "city", label: "City", type: "text", required: true },
      { name: "categories", label: "Categories", type: "multiselect", options: RESTAURANT_CATEGORIES, required: true }, { name: "address", label: "Address", type: "text", nullable: true }, lat, lng,
      { name: "openingHours", label: "Opening hours", type: "text", nullable: true }, { name: "contact", label: "Contact", type: "text", nullable: true },
      { name: "dietary", label: "Dietary info (comma separated)", type: "tags" }, { name: "averageCostIqd", label: "Average cost (IQD)", type: "number", nullable: true },
      images, providerLevel, status, lastVerified, isDemo, published,
    ],
  },
  restaurantMenus: {
    name: "restaurantMenus", label: "Restaurant menus", group: "Commerce", columns: ["name", "restaurantId", "priceIqd", "verificationStatus"],
    fields: [{ name: "restaurantId", label: "Restaurant", type: "ref", ref: "restaurants", required: true }, { name: "name", label: "Item", type: "text", required: true }, { name: "description", label: "Description", type: "text", nullable: true }, { name: "priceIqd", label: "Price (IQD)", type: "number", nullable: true }, status, lastVerified, isDemo, published],
  },
  priceRecords: {
    name: "priceRecords", label: "Fair Price records", group: "Commerce", columns: ["item", "category", "avg", "currency", "lastUpdated", "verificationStatus"],
    fields: [
      { name: "category", label: "Category", type: "select", options: PRICE_CATEGORIES, required: true }, { name: "item", label: "Item", type: "text", required: true },
      { name: "governorateId", label: "Governorate (empty = national)", type: "ref", ref: "governorates", nullable: true }, { name: "city", label: "City", type: "text", nullable: true }, { name: "provider", label: "Provider", type: "text", nullable: true },
      { name: "min", label: "Minimum", type: "number", required: true }, { name: "avg", label: "Average", type: "number", required: true }, { name: "max", label: "Maximum", type: "number", required: true },
      { name: "currency", label: "Currency", type: "select", options: ["IQD", "USD"], required: true }, { name: "unit", label: "Price unit", type: "text", required: true, help: "e.g. per night, per person, per trip, per km" },
      { name: "sourceId", label: "Source", type: "ref", ref: "officialSources", nullable: true }, { name: "sourceNote", label: "Source note", type: "text", nullable: true },
      { name: "lastUpdated", label: "Last updated", type: "date", required: true }, status, isDemo, published,
    ],
  },
  transportProviders: {
    name: "transportProviders", label: "Transport providers", group: "Commerce", columns: ["name", "modes", "providerLevel", "verificationStatus"],
    fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "modes", label: "Modes", type: "multiselect", options: TRANSPORT_MODES, required: true }, { name: "website", label: "Website", type: "text", nullable: true }, { name: "phone", label: "Phone", type: "text", nullable: true }, { name: "notes", label: "Notes", type: "textarea", nullable: true }, providerLevel, status, lastVerified, isDemo, published],
  },
  transportRoutes: {
    name: "transportRoutes", label: "Transport routes", group: "Commerce", columns: ["mode", "fromGovernorateId", "toGovernorateId", "verificationStatus"],
    fields: [
      { name: "mode", label: "Mode", type: "select", options: TRANSPORT_MODES, required: true }, { name: "fromGovernorateId", label: "From", type: "ref", ref: "governorates", required: true }, { name: "toGovernorateId", label: "To", type: "ref", ref: "governorates", required: true },
      { name: "providerId", label: "Provider", type: "ref", ref: "transportProviders", nullable: true }, { name: "priceMinIqd", label: "Price min (IQD)", type: "number", nullable: true }, { name: "priceMaxIqd", label: "Price max (IQD)", type: "number", nullable: true },
      { name: "durationMinutes", label: "Duration (minutes)", type: "number", nullable: true }, { name: "departure", label: "Departure", type: "text", nullable: true, help: "Only verified schedules." }, { name: "arrival", label: "Arrival", type: "text", nullable: true },
      { name: "luggage", label: "Luggage", type: "text", nullable: true }, { name: "bookingMethod", label: "Booking method", type: "text", nullable: true }, { name: "notes", label: "Notes", type: "textarea", nullable: true }, status, lastVerified, isDemo, published,
    ],
  },
  tourGuides: {
    name: "tourGuides", label: "Guides, drivers & agencies", group: "Trust", columns: ["name", "kind", "providerLevel", "verificationStatus"],
    fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "kind", label: "Kind", type: "select", options: ["guide", "agency", "driver"], required: true }, { name: "languages", label: "Languages (comma separated)", type: "tags" }, { name: "governorateIds", label: "Governorates", type: "refs", ref: "governorates" }, { name: "phone", label: "Phone", type: "text", nullable: true }, { name: "licenseNumber", label: "Licence number", type: "text", nullable: true, help: "Only record licences confirmed with the issuing authority." }, providerLevel, status, lastVerified, isDemo, published],
  },
  safetyAdvisories: {
    name: "safetyAdvisories", label: "Safety alerts", group: "Safety", columns: ["title", "issuer", "level", "kind", "active", "publishedAt"],
    fields: [
      { name: "kind", label: "Type", type: "select", options: ["official", "user_report"], required: true, help: "Official = issued by a government/authority with a source URL. User reports are shown separately." },
      { name: "issuer", label: "Issuer", type: "text", required: true }, { name: "title", label: "Title", type: "text", required: true }, { name: "body", label: "Text (English original)", type: "textarea", required: true },
      { name: "level", label: "Level", type: "select", options: ADVISORY_LEVELS, required: true }, { name: "category", label: "Category", type: "select", options: ADVISORY_CATEGORIES, required: true },
      { name: "governorateIds", label: "Governorates", type: "refs", ref: "governorates" }, { name: "siteIds", label: "Sites", type: "refs", ref: "touristSites" },
      { name: "sourceUrl", label: "Official source URL", type: "text", nullable: true }, { name: "publishedAt", label: "Published at", type: "datetime", required: true }, { name: "expiresAt", label: "Expires at", type: "datetime", nullable: true },
      { name: "active", label: "Active", type: "boolean" }, status, published,
    ],
  },
  emergencyContacts: {
    name: "emergencyContacts", label: "Emergency contacts", group: "Safety", columns: ["name", "kind", "phone", "verificationStatus", "published"],
    fields: [{ name: "kind", label: "Kind", type: "select", options: EMERGENCY_KINDS, required: true }, { name: "name", label: "Name", type: "text", required: true }, { name: "phone", label: "Phone", type: "text", nullable: true }, { name: "address", label: "Address", type: "text", nullable: true }, { name: "governorateId", label: "Governorate", type: "ref", ref: "governorates", nullable: true }, { name: "sourceId", label: "Official source (required to display)", type: "ref", ref: "officialSources", nullable: true }, { name: "notes", label: "Internal notes", type: "textarea", nullable: true }, status, lastVerified, published],
  },
  officialSources: {
    name: "officialSources", label: "Sources", group: "Trust", columns: ["name", "type", "url", "lastChecked"],
    fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "url", label: "URL", type: "text", required: true }, { name: "type", label: "Type", type: "select", options: ["government", "unesco", "carrier", "map_data", "advisory", "other"], required: true }, { name: "notes", label: "Notes", type: "textarea", nullable: true }, { name: "termsReviewed", label: "Terms of use reviewed", type: "boolean" }, { name: "lastChecked", label: "Last checked", type: "date", nullable: true }, published],
  },
  reviews: {
    name: "reviews", label: "Reviews", group: "Trust", columns: ["title", "targetType", "rating", "status", "authorName"],
    fields: [{ name: "status", label: "Moderation status", type: "select", options: ["pending", "approved", "rejected"], required: true }, { name: "targetType", label: "Target type", type: "select", options: ["hotel", "restaurant", "site", "tourGuide"], required: true }, { name: "targetId", label: "Target id", type: "text", required: true }, { name: "rating", label: "Rating (1-5)", type: "number", required: true }, { name: "title", label: "Title", type: "text", required: true }, { name: "body", label: "Body", type: "textarea", required: true }, { name: "authorName", label: "Author", type: "text", required: true }, isDemo, published],
  },
  scamReports: {
    name: "scamReports", label: "Complaints & scam reports", group: "Trust", columns: ["type", "providerName", "status", "createdAt"],
    fields: [{ name: "type", label: "Type", type: "select", options: REPORT_TYPES, required: true }, { name: "providerName", label: "Provider", type: "text", required: true }, { name: "providerType", label: "Provider type", type: "text", nullable: true }, { name: "governorateId", label: "Governorate", type: "ref", ref: "governorates", nullable: true }, { name: "description", label: "Description", type: "textarea", required: true }, { name: "amountPaid", label: "Amount paid", type: "text", nullable: true }, { name: "expectedAmount", label: "Expected amount", type: "text", nullable: true }, { name: "incidentDate", label: "Incident date", type: "date", nullable: true }, { name: "status", label: "Status", type: "select", options: REPORT_STATUSES, required: true }],
  },
};

export const ENTITY_ORDER: EntityName[] = ["governorates", "touristSites", "hotels", "restaurants", "restaurantMenus", "priceRecords", "transportProviders", "transportRoutes", "tourGuides", "safetyAdvisories", "emergencyContacts", "officialSources", "reviews"];

export function getEntityConfig(name: string): EntityConfig | null {
  return (ENTITIES as Record<string, EntityConfig>)[name] ?? null;
}

export function slugify(s: string): string {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
