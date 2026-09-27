import type { Currency } from "./types";

/**
 * Every measurement in this store is formatted through here so the measurement
 * column on the product grid and the spec table can never disagree, "39.0 mm"
 * on one and "39 mm" on the other is the kind of detail that gives a spec-led
 * boutique away.
 */

const CURRENCY_LOCALE: Record<Currency, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
};

const currencyFormatters = new Map<Currency, Intl.NumberFormat>();

function currencyFormatter(currency: Currency) {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    const locale = CURRENCY_LOCALE[currency] ?? "en-US";
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: currency === "JPY" ? 0 : 0,
    });
    currencyFormatters.set(currency, formatter);
  }
  return formatter;
}

/** 1450000 → "$14,500". Minor units, no decimals, luxury retail never shows cents. */
export function formatPrice(minorUnits: number, currency: Currency = "USD"): string {
  return currencyFormatter(currency).format(minorUnits / 100);
}

/**
 * The price delta shown next to a swatch. A positive delta reads as
 * "+$340"; a negative one keeps the sign, because a cheaper bracelet that
 * silently shows "$8,900" is a support ticket.
 */
export function formatPriceDelta(minorUnits: number, currency: Currency = "USD"): string {
  if (minorUnits === 0) return "Included";
  const formatted = currencyFormatter(currency).format(Math.abs(minorUnits) / 100);
  return minorUnits > 0 ? `+${formatted}` : `−${formatted}`;
}

/** 39 → "39.0". Trailing zero is deliberate: it is a measured quantity. */
export function formatMm(value: number, precision = 1): string {
  return value.toFixed(precision);
}

/** 39 → "39 mm", with a real non-breaking space so the unit never orphans. */
export function formatMmWithUnit(value: number, precision = 1): string {
  return `${formatMm(value, precision)} mm`;
}

/** 100 → "100 m", 3 → "3 bar"? No, depth is stated in metres, as ISO 22810 requires. */
export function formatWaterResistance(metres: number): string {
  return `${metres} m`;
}

/**
 * Null spec values read as words, never as a dash.
 *
 * A typographic dash as "no data" is the older convention, but it is a
 * placeholder pretending to be content, and on a spec row it reads as a
 * rendering fault rather than as a decision. Spelling it out costs a few
 * characters and removes the ambiguity.
 */
export function formatPowerReserve(hours: number | null): string {
  return hours === null ? "Not stated" : `${hours} h`;
}

export function formatFrequency(vph: number | null): string {
  if (vph === null) return "Not stated";
  return `${vph.toLocaleString("en-US")} vph`;
}

/** 0.5 -> "±0.5 s/day". The maker's own deviation figure, never invented. */
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

/** Human label for an enum value: "white-gold" → "White gold". */
export function humanise(value: string): string {
  const spaced = value.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Pluralisation without the "1 watches" problem. */
export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/**
 * Small counts as words, for prose rather than spec sheets.
 *
 * "13 references" in a heading reads like a data table; "thirteen references"
 * reads like a sentence. This exists because the collection copy had the count
 * hardcoded as "Twelve references" while the catalog held thirteen products, and
 * the same stale twelve was repeated across the hero, the collection heading, the
 * "Showing six of twelve" line and the 404 page. Four places, one wrong number.
 *
 * Only the teens are covered, because that is the range the catalog sits in. A
 * count outside the table falls through to digits rather than inventing a word,
 * so an unexpected catalog size produces "14 references" and not a wrong word.
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
