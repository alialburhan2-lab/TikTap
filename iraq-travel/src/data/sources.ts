import type { OfficialSource } from "./types";
import { base } from "./helpers";

/**
 * Initial list of official / authoritative sources (from the project brief).
 * Links and terms of use must be reviewed by an editor; `termsReviewed` is false until then.
 */
export const officialSources: OfficialSource[] = [
  { ...base("src-unesco"), name: "UNESCO World Heritage Centre", url: "https://whc.unesco.org/", type: "unesco", notes: "World Heritage listings and inscription details.", termsReviewed: false, lastChecked: null },
  { ...base("src-mota"), name: "Iraqi Ministry of Culture, Tourism and Antiquities", url: "https://mota.gov.iq/", type: "government", notes: "Official source for site access, opening hours and fees.", termsReviewed: false, lastChecked: null },
  { ...base("src-iqairways"), name: "Iraqi Airways", url: "https://www.iqairways.com/", type: "carrier", notes: "National carrier. Use for domestic flight schedules and fares — do not copy schedules without checking terms.", termsReviewed: false, lastChecked: null },
  { ...base("src-osm"), name: "OpenStreetMap", url: "https://www.openstreetmap.org/", type: "map_data", notes: "Map tiles and geodata © OpenStreetMap contributors (ODbL). Attribution required.", termsReviewed: false, lastChecked: null },
  { ...base("src-fcdo"), name: "UK FCDO Foreign Travel Advice — Iraq", url: "https://www.gov.uk/foreign-travel-advice/iraq", type: "advisory", notes: "Government travel advisory (United Kingdom).", termsReviewed: false, lastChecked: null },
  { ...base("src-usdos"), name: "U.S. Department of State — Travel Advisories", url: "https://travel.state.gov/", type: "advisory", notes: "Government travel advisory (United States).", termsReviewed: false, lastChecked: null },
];
