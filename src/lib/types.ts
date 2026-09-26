/**
 * Domain model for Chronos & Steel.
 *
 * These types are the seam between this frontend and the backend you own. Each
 * one is shaped to map 1:1 onto a Prisma model, when you write `schema.prisma`
 * mirror these field names so the repository adapter in `lib/catalog/repository.ts`
 * is the only file you need to touch.
 *
 * Money is always integer minor units (cents), never a float. `priceInCents`
 * is the amount on a configurator's BASE product; every variant price is derived
 * from it at read time, never stored separately. See `resolveVariantPrice`.
 */

export type Currency = "USD" | "EUR" | "GBP" | "JPY";

export type MovementType = "automatic" | "manual" | "quartz";

export type CaseMaterial =
  | "stainless-steel"
  | "white-gold"
  | "rose-gold"
  | "yellow-gold"
  | "titanium"
  | "platinum"
  | "ceramic"
  | "bronze";

export type CaseFinish = "polished" | "brushed" | "sandblasted" | "bead-blasted";

export type BezelType =
  | "smooth"
  | "fluted"
  | "dive"
  | "tachymeter"
  | "coin-edge"
  | "gem-set";

export type CrystalType = "sapphire" | "domed-sapphire" | "mineral" | "acrylic";

export type IndexStyle =
  | "baton"
  | "roman"
  | "arabic"
  | "dauphine"
  | "mixed"
  | "minimal";

export type StrapType =
  | "bracelet"
  | "leather"
  | "rubber"
  | "nato"
  | "mesh"
  | "perforated";

export type Complication =
  | "date"
  | "chronograph"
  | "moonphase"
  | "gmt"
  | "power-reserve"
  | "small-seconds"
  | "alarm";

export type ComplicationPlacement = "subdial" | "window" | "inner-ring" | "none";

export interface StrapOption {
  id: string;
  type: StrapType;
  /** Human label, e.g. "Black alligator". */
  name: string;
  material: string;
  /** Drives the SVG renderer. */
  colorHex: string;
  colorName: string;
  /** Added to the base price. Can be negative. */
  priceDeltaInCents: number;
  /** Lug width in mm, must match the case or the variant is not buildable. */
  widthMm: number;
  stitchColorHex?: string;
}

export interface DialOption {
  id: string;
  name: string;
  colorName: string;
  colorHex: string;
  /** Sunburst dials get a radial sheen in the renderer. */
  finish: "matte" | "sunburst" | "lacquered" | "guilloche" | "salmon";
  priceDeltaInCents: number;
  /** Per-dial, because a no-date dial is a genuinely different dial. */
  readonly complications: readonly Complication[];
  readonly complicationPlacements: Partial<Record<Complication, ComplicationPlacement>>;
}

export interface Movement {
  type: MovementType;
  caliber: string;
  manufacturer: string;
  powerReserveHours: number | null;
  /** Vibrations per hour, 28,800 is the modern "sweeping" standard. */
  frequencyVph: number | null;
  jewels: number | null;
  components: number | null;
  /** Signed percentage of retail, or null when the maker does not disclose. */
  chronometerDeviationPercent: number | null;
  winding: "self-winding" | "hand-wound" | "quartz" | null;
}

export interface CaseSpec {
  diameterMm: number;
  thicknessMm: number;
  lugToLugMm: number;
  lugWidthMm: number;
  material: CaseMaterial;
  finish: CaseFinish;
  bezel: BezelType;
  crystal: CrystalType;
  waterResistanceM: number;
}

export interface DialSpec {
  option: DialOption;
  indexStyle: IndexStyle;
  readonly complications: readonly Complication[];
  readonly complicationPlacements: Partial<Record<Complication, ComplicationPlacement>>;
  lume: boolean;
  /** Text printed above centre, e.g. "CHRONOS & STEEL". */
  signature: string;
  sublabel: string | null;
}

export interface Product {
  id: string;
  slug: string;
  brand: string;
  model: string;
  /** e.g. "CS-114-02". Shown in the measurement column. */
  reference: string;
  yearIntroduced: number;
  collection: string;
  /** One sentence, plain, no adjective stacking. */
  summary: string;
  /** Long-form editorial, 2–3 paragraphs. */
  story: string;
  caseSpec: CaseSpec;
  movement: Movement;
  dials: DialOption[];
  straps: StrapOption[];
  /** Shared across every dial on this case. */
  indexStyle: IndexStyle;
  lume: boolean;
  signature: string;
  sublabel: string | null;
  basePriceInCents: number;
  currency: Currency;
  /** null means made to order, rendered as "Made to order", never a fake number. */
  stock: number | null;
  /** Units held in the inventory-lock window. null = not tracked. */
  reserved: number | null;
  editionSize: number | null;
  featured: boolean;
  tags: string[];
}

/* ── Resolved variants ─────────────────────────────────────────────────────
 * A variant is the resolution of one dial × one strap choice. It is computed,
 * not stored, which keeps the Prisma schema to two option tables and stops
 * the two axes drifting out of sync. Stock is per-variant when the backend
 * supplies it, otherwise inherited from the product. */

export interface ResolvedVariant {
  key: string;
  productId: string;
  dial: DialOption;
  strap: StrapOption;
  priceInCents: number;
  sku: string;
  /** null = made to order. */
  stock: number | null;
  /** false when the maker does not build this pairing. */
  available: boolean;
  /** Populated when stock is 0 but the piece is buildable. */
  leadTimeWeeks: number | null;
}

export interface VariantSelection {
  dialId: string;
  strapId: string;
}

/* ── Faceted filtering ─────────────────────────────────────────────────── */

export interface FacetValue<T extends string = string> {
  value: T;
  label: string;
  /** Raw value used for range maths, e.g. the mm figure for a size facet. */
  numeric?: number;
}

export interface FacetDefinition {
  id: string;
  label: string;
  /** "chips" = multi-select pills · "range" = dual numeric slider · "swatch" = colour dots */
  control: "chips" | "range" | "swatch";
  values: FacetValue[];
  unit?: string;
}

export type SortKey =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "diameter-asc"
  | "diameter-desc"
  | "newest";

/** Serialised filter state, the shape that lives in the URL. */
export interface FilterState {
  q: string;
  movement: MovementType[];
  material: CaseMaterial[];
  strap: StrapType[];
  dial: string[];
  complication: Complication[];
  /** Inclusive mm bounds, or null for an open end. */
  diameterMin: number | null;
  diameterMax: number | null;
  /** Inclusive mm bounds. */
  lugToLugMax: number | null;
  priceMinInCents: number | null;
  priceMaxInCents: number | null;
  sort: SortKey;
}
