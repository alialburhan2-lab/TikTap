/**
 * يولّد Slug صديقاً لمحركات البحث يدعم العربية والإنجليزية.
 * يزيل التشكيل والرموز ويستبدل المسافات بشرطة.
 */
export function slugify(input: string, maxLength = 80): string {
  const s = input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "") // التشكيل والتطويل
    .replace(/[أإآ]/g, "ا")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, maxLength).replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= 120 && SLUG_PATTERN.test(slug);
}

/** فك ترميز معامل المسار بأمان */
export function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
