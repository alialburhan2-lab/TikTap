import type { EmergencyContact, SafetyAdvisory } from "./types";
import { base } from "./helpers";

/**
 * No official advisory is seeded: current advisories could not be verified when this
 * data was prepared. Safety editors publish advisories through /admin with the issuer,
 * source URL and publication date. The public Safety Center shows
 * "Current information unavailable – Verify before travel" until then.
 */
export const safetyAdvisories: SafetyAdvisory[] = [];

/**
 * DRAFT emergency numbers (published: false). These are commonly cited but have NOT been
 * confirmed against an official Iraqi government source. A safety editor must verify and
 * publish them; until then they never appear on the public site.
 */
const draft = (id: string) => base(id, { published: false });
export const emergencyContacts: EmergencyContact[] = [
  { ...draft("em-police"), kind: "police", name: "Police (national)", phone: "104", address: null, governorateId: null, sourceId: null, notes: "DRAFT — commonly cited; confirm with an official Iraqi source before publishing.", verificationStatus: "unverified", lastVerified: null },
  { ...draft("em-ambulance"), kind: "ambulance", name: "Ambulance (national)", phone: "122", address: null, governorateId: null, sourceId: null, notes: "DRAFT — commonly cited; confirm with an official Iraqi source before publishing.", verificationStatus: "unverified", lastVerified: null },
  { ...draft("em-fire"), kind: "fire", name: "Civil Defence / Fire (national)", phone: "115", address: null, governorateId: null, sourceId: null, notes: "DRAFT — commonly cited; confirm with an official Iraqi source before publishing.", verificationStatus: "unverified", lastVerified: null },
];
