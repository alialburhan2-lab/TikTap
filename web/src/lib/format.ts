const dateFmt = new Intl.DateTimeFormat("ar", { year: "numeric", month: "long", day: "numeric" });
const monthFmt = new Intl.DateTimeFormat("ar", { year: "numeric", month: "long" });
const numFmt = new Intl.NumberFormat("ar");

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return dateFmt.format(new Date(d));
}

export function formatMonth(year: number, month: number): string {
  return monthFmt.format(new Date(Date.UTC(year, month - 1, 15)));
}

export function formatNumber(n: number): string {
  return numFmt.format(n);
}

export const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
