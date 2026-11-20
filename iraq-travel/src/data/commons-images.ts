import type { ImageAsset } from "./types";

/**
 * Photographs hosted on Wikimedia Commons, displayed directly from upload/thumb.wikimedia.org
 * with photographer and licence on every image. Keys: "site:<slug>" or "gov:<slug>".
 * Generated from a reviewed Commons lookup (free licence, named author, file is in the place's
 * Commons category / description names the place, not a map, drawing, model or museum object abroad).
 */
export const COMMONS_IMAGES: Record<string, ImageAsset[]> = {};
