import type { Currency } from "./types";

/**
 * Every measurement in the store is formatted through here, so the measurement
 * column on the product grid and the spec table can never disagree. "39.0 mm" on
 * one and "39 mm" on the other is the kind of detail that gives a spec-led
 * boutique away.
 */

/**
 * The currency the storefront is presented in.
 *
 * Every product carries `currency: "USD"`, which records where the reference was
 * priced, not what the page shows. Naming the storefront currency once here is
 * what stops the price rail, the removable chips and the cards from disagreeing.
 * Swap it here rather than at four call sites.
 */
export const STOREFRONT_CURRENCY: Currency = "GBP";

const CURRENCY_LOCALE: Record<Currency, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
};

const currencyFormatters = new Map<Currency, Intl.NumberFormat>();

function currencyFormatter(currency: Currency) {
  const cached = currencyFormatters.get(currency);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    // Luxury retail never shows cents, and JPY has no minor unit at all.
    maximumFractionDigits: 0,
  });
  currencyFormatters.set(currency, formatter);
  return formatter;
}

/** 1450000 -> "$14,500" */
export function formatPrice(minorUnits: number, currency: Currency = "USD"): string {
  return currencyFormatter(currency).format(minorUnits / 100);
}

/**
 * The delta shown next to a swatch. A negative one keeps its sign, because a
 * cheaper bracelet that silently reads "$8,900" is a support ticket.
 */
export function formatPriceDelta(minorUnits: number, currency: Currency = "USD"): string {
  if (minorUnits === 0) return "Included";
  const formatted = currencyFormatter(currency).format(Math.abs(minorUnits) / 100);
  return minorUnits > 0 ? `+${formatted}` : `−${formatted}`;
}

/** 39 -> "39.0". The trailing zero is deliberate: this is a measured quantity. */
export function formatMm(value: number, precision = 1): string {
  return value.toFixed(precision);
}

export function formatMmWithUnit(value: number, precision = 1): string {
  return `${formatMm(value, precision)} mm`;
}

/** Depth is stated in metres, as ISO 22810 requires. */
export function formatWaterResistance(metres: number): string {
  return `${metres} m`;
}

/**
 * Null spec values read as words, never as a dash. A typographic dash is a
 * placeholder pretending to be content, and on a spec row it reads as a
 * rendering fault rather than as a decision.
 */
export function formatPowerReserve(hours: number | null): string {
  return hours === null ? "Not stated" : `${hours} h`;
}

export function formatFrequency(vph: number | null): string {
  return vph === null ? "Not stated" : `${vph.toLocaleString("en-US")} vph`;
}

/** 0.5 -> "±0.5 s/day". The maker's own figure, never invented. */
export function formatDeviation(percent: number | null): string {
  return percent === null ? "Not stated" : `±${percent} s/day`;
}

export function formatJewels(jewels: number | null): string {
  return jewels === null ? "Not stated" : String(jewels);
}

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part.length > 0 ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/** "white-gold" -> "White gold" */
export function humanise(value: string): string {
  const spaced = value.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/**
 * Small counts as words, for prose rather than spec sheets: "thirteen references"
 * reads like a sentence, "13 references" reads like a data table.
 *
 * The count was once hardcoded as "Twelve references" in four places while the
 * catalogue held thirteen products, so the number is derived everywhere instead.
 * Only the teens are tabulated, the range the catalogue sits in; anything else
 * falls through to digits rather than inventing a word.
 */
const COUNT_WORDS: Record<number, string> = {
  11: "eleven",
  12: "twelve",
  13: "thirteen",
  14: "fourteen",
  15: "fifteen",
  16: "sixteen",
  17: "seventeen",
  18: "eighteen",
  19: "nineteen",
};

export function countWord(count: number): string {
  return COUNT_WORDS[count] ?? String(count);
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
