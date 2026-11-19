export type Currency = "IQD" | "USD";

export function toIqd(amount: number, currency: Currency, rate: number): number {
  return currency === "IQD" ? amount : amount * rate;
}

export function toUsd(amount: number, currency: Currency, rate: number): number {
  return currency === "USD" ? amount : amount / rate;
}

export function formatIqd(amount: number, locale = "en"): string {
  const rounded = amount >= 1000 ? Math.round(amount / 250) * 250 : Math.round(amount);
  return `${new Intl.NumberFormat(locale === "ckb" ? "en" : locale, { maximumFractionDigits: 0 }).format(rounded)} IQD`;
}

export function formatUsd(amount: number, locale = "en"): string {
  return new Intl.NumberFormat(locale === "ckb" ? "en" : locale, { style: "currency", currency: "USD", maximumFractionDigits: amount < 10 ? 2 : 0 }).format(amount);
}

/** "12,000 IQD (≈ $9)" — always shows both currencies. */
export function dualPrice(amount: number, currency: Currency, rate: number, locale = "en"): string {
  const iqd = toIqd(amount, currency, rate);
  const usd = toUsd(amount, currency, rate);
  return currency === "IQD" ? `${formatIqd(iqd, locale)} (≈ ${formatUsd(usd, locale)})` : `${formatUsd(usd, locale)} (≈ ${formatIqd(iqd, locale)})`;
}
