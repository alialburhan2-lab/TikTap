import type { Locale } from "@/i18n/config";

/** Text with an English original and optional translations. */
export type LocalizedText = { en: string } & Partial<Record<Exclude<Locale, "en">, string>>;

/** Data quality status shown on every factual record. */
export type VerificationStatus = "verified" | "partially_verified" | "estimated" | "unverified" | "outdated";
export const VERIFICATION_STATUSES: VerificationStatus[] = ["verified", "partially_verified", "estimated", "unverified", "outdated"];

/** Trust level for service providers. Only admins can raise it after document review. */
export type ProviderVerificationLevel = "unverified" | "contact_verified" | "documents_checked" | "license_verified";
export const PROVIDER_LEVELS: ProviderVerificationLevel[] = ["unverified", "contact_verified", "documents_checked", "license_verified"];

export type Interest = "archaeology" | "history" | "nature" | "food" | "religious" | "culture" | "entertainment";
export const INTERESTS: Interest[] = ["archaeology", "history", "nature", "food", "religious", "culture", "entertainment"];

export type SiteCategory = "archaeological" | "religious" | "natural" | "museum" | "historic_city" | "market" | "park" | "cultural";
export const SITE_CATEGORIES: SiteCategory[] = ["archaeological", "religious", "natural", "museum", "historic_city", "market", "park", "cultural"];

export type AccessStatus = "open" | "restricted" | "closed" | "unknown";

export interface ImageAsset {
  url: string;
  alt: string;
  credit: string;
  license: string;
  sourceUrl: string;
  /** An editor confirmed the photo depicts this exact place. */
  verified: boolean;
}

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Clearly-labelled sample data that is NOT real. */
  isDemo?: boolean;
  published: boolean;
}

export interface Governorate extends BaseRecord {
  slug: string;
  name: LocalizedText;
  region: "federal" | "kurdistan_region";
  capital: LocalizedText;
  summary: LocalizedText;
  history: LocalizedText;
  geography: LocalizedText;
  bestTimeToVisit: LocalizedText;
  lat: number;
  lng: number;
  images: ImageAsset[];
  verificationStatus: VerificationStatus;
  lastVerified: string | null;
  sourceIds: string[];
}

export interface TouristSite extends BaseRecord {
  slug: string;
  governorateId: string;
  name: LocalizedText;
  categories: SiteCategory[];
  interests: Interest[];
  summary: LocalizedText;
  history: LocalizedText;
  lat: number;
  lng: number;
  coordinatesApproximate: boolean;
  unesco: { listing: string; year: number; url: string } | null;
  images: ImageAsset[];
  openingHours: string | null;
  entranceFee: string | null;
  visitorRestrictions: string | null;
  accessibility: string | null;
  accessStatus: AccessStatus;
  recommendedVisitHours: number;
  sourceIds: string[];
  verificationStatus: VerificationStatus;
  lastVerified: string | null;
  featured: boolean;
}

export type HotelCategory = "budget" | "mid_range" | "luxury" | "family" | "boutique";
export const HOTEL_CATEGORIES: HotelCategory[] = ["budget", "mid_range", "luxury", "family", "boutique"];

export interface Hotel extends BaseRecord {
  slug: string;
  name: string;
  governorateId: string;
  city: string;
  category: HotelCategory;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  roomPriceMinUsd: number | null;
  roomPriceMaxUsd: number | null;
  breakfast: boolean | null;
  wifi: boolean | null;
  airConditioning: boolean | null;
  parking: boolean | null;
  facilities: string[];
  cancellationPolicy: string | null;
  bookingContact: string | null;
  images: ImageAsset[];
  providerLevel: ProviderVerificationLevel;
  verificationStatus: VerificationStatus;
  lastVerified: string | null;
}

export type RestaurantCategory = "iraqi_traditional" | "fine_dining" | "international" | "family" | "vegetarian" | "halal" | "cafe" | "desserts";
export const RESTAURANT_CATEGORIES: RestaurantCategory[] = ["iraqi_traditional", "fine_dining", "international", "family", "vegetarian", "halal", "cafe", "desserts"];

export interface Restaurant extends BaseRecord {
  slug: string;
  name: string;
  governorateId: string;
  city: string;
  categories: RestaurantCategory[];
  address: string | null;
  lat: number | null;
  lng: number | null;
  openingHours: string | null;
  contact: string | null;
  dietary: string[];
  averageCostIqd: number | null;
  images: ImageAsset[];
  providerLevel: ProviderVerificationLevel;
  verificationStatus: VerificationStatus;
  lastVerified: string | null;
}

export interface RestaurantMenuItem extends BaseRecord {
  restaurantId: string;
  name: string;
  description: string | null;
  priceIqd: number | null;
  verificationStatus: VerificationStatus;
  lastVerified: string | null;
}

export type TransportMode = "domestic_flight" | "train" | "intercity_bus" | "private_car" | "taxi" | "airport_transfer";
export const TRANSPORT_MODES: TransportMode[] = ["domestic_flight", "train", "intercity_bus", "private_car", "taxi", "airport_transfer"];

export interface TransportProvider extends BaseRecord {
  name: string;
  modes: TransportMode[];
  website: string | null;
  phone: string | null;
  notes: string | null;
  providerLevel: ProviderVerificationLevel;
  verificationStatus: VerificationStatus;
  lastVerified: string | null;
}

export interface TransportRoute extends BaseRecord {
  mode: TransportMode;
  fromGovernorateId: string;
  toGovernorateId: string;
  providerId: string | null;
  priceMinIqd: number | null;
  priceMaxIqd: number | null;
  durationMinutes: number | null;
  departure: string | null;
  arrival: string | null;
  luggage: string | null;
  bookingMethod: string | null;
  notes: string | null;
  verificationStatus: VerificationStatus;
  lastVerified: string | null;
}

export interface TourGuide extends BaseRecord {
  name: string;
  kind: "guide" | "agency" | "driver";
  languages: string[];
  governorateIds: string[];
  phone: string | null;
  licenseNumber: string | null;
  providerLevel: ProviderVerificationLevel;
  verificationStatus: VerificationStatus;
  lastVerified: string | null;
}

export type PriceCategory = "restaurant" | "hotel" | "taxi" | "private_driver" | "domestic_transport" | "tour_guide" | "entrance_fee" | "activity";
export const PRICE_CATEGORIES: PriceCategory[] = ["restaurant", "hotel", "taxi", "private_driver", "domestic_transport", "tour_guide", "entrance_fee", "activity"];

export interface PriceRecord extends BaseRecord {
  category: PriceCategory;
  item: string;
  governorateId: string | null;
  city: string | null;
  provider: string | null;
  min: number;
  avg: number;
  max: number;
  currency: "IQD" | "USD";
  unit: string;
  sourceId: string | null;
  sourceNote: string | null;
  lastUpdated: string;
  verificationStatus: VerificationStatus;
}

export type AdvisoryLevel = "info" | "caution" | "reconsider_travel" | "against_all_but_essential" | "against_all_travel";
export const ADVISORY_LEVELS: AdvisoryLevel[] = ["info", "caution", "reconsider_travel", "against_all_but_essential", "against_all_travel"];
export type AdvisoryCategory =
  | "government_advisory" | "local_restriction" | "road_condition" | "entry_requirement" | "site_access"
  | "medical" | "emergency_guidance" | "photography" | "insurance";
export const ADVISORY_CATEGORIES: AdvisoryCategory[] = [
  "government_advisory", "local_restriction", "road_condition", "entry_requirement", "site_access",
  "medical", "emergency_guidance", "photography", "insurance",
];

export interface SafetyAdvisory extends BaseRecord {
  kind: "official" | "user_report";
  issuer: string;
  title: string;
  body: string;
  level: AdvisoryLevel;
  category: AdvisoryCategory;
  governorateIds: string[];
  siteIds: string[];
  sourceUrl: string | null;
  publishedAt: string;
  expiresAt: string | null;
  active: boolean;
  verificationStatus: VerificationStatus;
}

export type EmergencyKind = "emergency_number" | "hospital" | "ambulance" | "police" | "fire" | "embassy" | "insurance";
export const EMERGENCY_KINDS: EmergencyKind[] = ["emergency_number", "hospital", "ambulance", "police", "fire", "embassy", "insurance"];

export interface EmergencyContact extends BaseRecord {
  kind: EmergencyKind;
  name: string;
  phone: string | null;
  address: string | null;
  governorateId: string | null;
  sourceId: string | null;
  notes: string | null;
  verificationStatus: VerificationStatus;
  lastVerified: string | null;
}

export interface OfficialSource extends BaseRecord {
  name: string;
  url: string;
  type: "government" | "unesco" | "carrier" | "map_data" | "advisory" | "other";
  notes: string | null;
  termsReviewed: boolean;
  lastChecked: string | null;
}

export type ReportType = "fraud" | "overcharging" | "fake_booking" | "incorrect_price" | "complaint";
export const REPORT_TYPES: ReportType[] = ["fraud", "overcharging", "fake_booking", "incorrect_price", "complaint"];
export type ReportStatus = "new" | "under_review" | "action_taken" | "dismissed";
export const REPORT_STATUSES: ReportStatus[] = ["new", "under_review", "action_taken", "dismissed"];

export interface ScamReport extends BaseRecord {
  type: ReportType;
  providerName: string;
  providerType: string | null;
  governorateId: string | null;
  description: string;
  amountPaid: string | null;
  expectedAmount: string | null;
  incidentDate: string | null;
  /** Private: never rendered publicly. */
  contactEmail: string | null;
  status: ReportStatus;
  actions: { at: string; by: string; note: string }[];
}

export interface VerificationDocument extends BaseRecord {
  providerType: "hotel" | "restaurant" | "tourGuide" | "transportProvider";
  providerId: string;
  docType: "business_license" | "tourism_license" | "identity" | "contact_check" | "other";
  /** Path inside the PRIVATE storage bucket. Never public. */
  storagePath: string | null;
  requestedLevel: ProviderVerificationLevel;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
}

export interface Review extends BaseRecord {
  targetType: "hotel" | "restaurant" | "site" | "tourGuide";
  targetId: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  status: "pending" | "approved" | "rejected";
}

export interface TravelItinerary extends BaseRecord {
  userId: string | null;
  title: string;
  input: unknown;
  days: unknown;
}

export interface Booking extends BaseRecord {
  targetType: string;
  targetId: string;
  status: "not_available";
  note: string;
}

export interface ContentUpdate extends BaseRecord {
  entity: string;
  recordId: string;
  summary: string;
  actorEmail: string;
}

export type Role = "super_admin" | "editor" | "price_manager" | "safety_editor" | "verification_officer" | "traveler";
export const ROLES: Role[] = ["super_admin", "editor", "price_manager", "safety_editor", "verification_officer", "traveler"];

export interface AppUser extends BaseRecord {
  email: string;
  displayName: string;
  role: Role;
  /** Demo store only (scrypt). Supabase uses auth.users instead. */
  passwordHash?: string;
  disabled: boolean;
}

export interface AdminLog extends BaseRecord {
  actorId: string;
  actorEmail: string;
  action: string;
  entity: string;
  recordId: string | null;
  details: string | null;
}

export interface EntityMap {
  governorates: Governorate;
  touristSites: TouristSite;
  hotels: Hotel;
  restaurants: Restaurant;
  restaurantMenus: RestaurantMenuItem;
  transportProviders: TransportProvider;
  transportRoutes: TransportRoute;
  tourGuides: TourGuide;
  priceRecords: PriceRecord;
  safetyAdvisories: SafetyAdvisory;
  emergencyContacts: EmergencyContact;
  officialSources: OfficialSource;
  scamReports: ScamReport;
  verificationDocuments: VerificationDocument;
  reviews: Review;
  travelItineraries: TravelItinerary;
  bookings: Booking;
  contentUpdates: ContentUpdate;
  users: AppUser;
  adminLogs: AdminLog;
}
export type EntityName = keyof EntityMap;
export type Store = { [K in EntityName]: EntityMap[K][] };
