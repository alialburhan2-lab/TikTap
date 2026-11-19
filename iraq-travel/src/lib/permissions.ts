import type { EntityName, Role } from "@/data/types";

/** Which roles may create/edit/delete each entity. super_admin may manage everything. */
export const ENTITY_ROLES: Record<EntityName, Role[]> = {
  governorates: ["editor"],
  touristSites: ["editor"],
  hotels: ["editor"],
  restaurants: ["editor"],
  restaurantMenus: ["editor", "price_manager"],
  transportProviders: ["editor"],
  transportRoutes: ["editor", "price_manager"],
  tourGuides: ["editor"],
  priceRecords: ["price_manager"],
  safetyAdvisories: ["safety_editor"],
  emergencyContacts: ["safety_editor"],
  officialSources: ["editor", "safety_editor"],
  scamReports: ["verification_officer"],
  verificationDocuments: ["verification_officer"],
  reviews: ["editor"],
  travelItineraries: [],
  bookings: [],
  contentUpdates: [],
  users: [],
  adminLogs: [],
};

export const STAFF_ROLES: Role[] = ["super_admin", "editor", "price_manager", "safety_editor", "verification_officer"];

export function isStaff(role: Role | undefined | null): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

export function canManage(role: Role | undefined | null, entity: EntityName): boolean {
  if (!role) return false;
  if (role === "super_admin") return true;
  return ENTITY_ROLES[entity].includes(role);
}

/** Raising a provider's verification level is reserved for verification officers. */
export function canSetProviderLevel(role: Role | undefined | null): boolean {
  return role === "super_admin" || role === "verification_officer";
}

/** Only these roles may mark a record's data status as "verified". */
export function canMarkVerified(role: Role | undefined | null, entity: EntityName): boolean {
  if (role === "super_admin") return true;
  if (entity === "priceRecords") return role === "price_manager";
  if (entity === "safetyAdvisories" || entity === "emergencyContacts") return role === "safety_editor";
  return role === "editor" || role === "verification_officer";
}
