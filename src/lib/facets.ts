import type { Currency, FilterState, Product } from "./types";
import {
  COMPLICATION_VALUES,
  MATERIAL_VALUES,
  MOVEMENT_VALUES,
  STRAP_VALUES,
  catalogBounds,
  countFacetValues,
  productMatches,
  selectedValues,
  type ChipFacetId,
  type FacetId,
} from "./filters";
import { formatMm, formatPrice, humanise } from "./format";

/**
 * Facet presentation.
 *
 * `lib/filters.ts` decides what matches and how many there are. This file decides
 * what the rail shows: which values exist, what they are called, and in what order.
 * The split exists because the value lists are read off the catalogue rather than
 * written by hand. A hand-written list goes stale the first time a dial is
 * discontinued, and the rail then offers a dial nobody can buy, with a count, on
 * purpose.
 *
 * Counts are the engine's numbers, not this file's, and a value that currently
 * returns zero is still listed and rendered inert: a rail that reshuffles under
 * the cursor is worse than one that admits what is unavailable.
 *
 * Range options are derived from the values actually in the catalogue, so every
 * option is non-empty by construction and its label is the truth about the
 * watches inside it. Whole millimetres are what a collector narrows by anyway, and
 * a bucket links where a dual-handle slider would report two numbers to the URL.
 */

/** Abbreviations the label cannot be derived from. Everything else humanises. */
const LABELS: Record<string, string> = {
  gmt: "GMT",
  moonphase: "Moon phase",
  nato: "NATO",
};

/** Where a value lands in the URL and what it selects, for the rail's links. */
export interface FacetOption {
  value: string;
  label: string;
  /** Results this option would yield right now, against every other facet. */
  count: number;
  selected: boolean;
  /** Dial swatch, so the colour facet is read by colour rather than by name. */
  colorHex?: string;
  /** Range groups only: the inclusive bounds this option selects. */
  range?: { min: number | null; max: number | null };
}

export interface FacetGroup {
  id: FacetId;
  label: string;
  options: FacetOption[];
}

interface ValueMeta {
  value: string;
  label: string;
  colorHex?: string;
}

/* ── Chip groups ────────────────────────────────────────────────────────── */

/**
 * Every distinct value a facet can take, in the declared order where the engine
 * has one, then in catalogue order.
 *
 * The declared order is there so the rail is not alphabetical by accident:
 * automatic before manual before quartz is a meaningful order, and so is bracelet
 * before NATO. A value the declared list has never heard of still appears, at the
 * end.
 */
function collect(
  products: Product[],
  pick: (product: Product) => string[],
  declared: readonly string[],
  label: (value: string) => string = (value) => LABELS[value] ?? humanise(value),
): ValueMeta[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const product of products) {
    for (const value of pick(product)) {
      if (seen.has(value)) continue;
      seen.add(value);
      found.push(value);
    }
  }
  const ordered = [
    ...declared.filter((value) => seen.has(value)),
    ...found.filter((value) => !declared.includes(value)),
  ];
  return ordered.map((value) => ({ value, label: label(value) }));
}

/**
 * Dials keep the catalogue's own name and colour rather than a label derived
 * from the id. "Midnight blue" is what the house calls it, and the swatch is
 * the whole point of reading this facet as a colour.
 */
function dialValues(products: Product[]): ValueMeta[] {
  const byId = new Map<string, ValueMeta>();
  for (const product of products) {
    for (const dial of product.dials) {
      if (byId.has(dial.id)) continue;
      byId.set(dial.id, { value: dial.id, label: dial.name, colorHex: dial.colorHex });
    }
  }
  return [...byId.values()];
}

function chipGroup(
  products: Product[],
  state: FilterState,
  id: ChipFacetId,
  label: string,
  values: ValueMeta[],
): FacetGroup {
  const counts = countFacetValues(products, state, id);
  const selected = new Set(selectedValues(state, id));
  return {
    id,
    label,
    options: values.map((value) => ({
      value: value.value,
      label: value.label,
      count: counts.get(value.value) ?? 0,
      selected: selected.has(value.value),
      colorHex: value.colorHex,
    })),
  };
}

/* ── Range groups ───────────────────────────────────────────────────────── */

/**
 * How many products a hypothetical state would return.
 *
 * `productMatches` takes a `skip` argument and it is deliberately not used here.
 * A range option's count is asked with the *new* bounds already in the state, so
 * skipping the facet would skip the very thing being counted and every band would
 * report the whole catalogue. Where a band is already selected the hypothetical
 * state replaces it, which is the question being asked: "how many if I move to
 * this band".
 */
function countWith(products: Product[], hypothetical: FilterState): number {
  return products.filter((product) => productMatches(product, hypothetical)).length;
}

/**
 * Case diameter, in inclusive millimetre bands of two.
 *
 * Built from the diameters that exist, so the label always describes the watches
 * inside it. 36 and 37 are one band because no collector separates a 36 from a
 * 37; 42 and 43 likewise. The upper bound is inclusive, so "40.0–41.0 mm" means
 * what it says.
 */
function diameterGroup(products: Product[], state: FilterState): FacetGroup {
  const diameters = [...new Set(products.map((p) => p.caseSpec.diameterMm))].sort(
    (a, b) => a - b,
  );
  const options: FacetOption[] = [];

  for (let i = 0; i < diameters.length; i += 2) {
    const band = diameters.slice(i, i + 2);
    const min = band[0]!;
    const max = band[band.length - 1]!;
    options.push({
      value: `${min}-${max}`,
      label: `${formatMm(min)}–${formatMm(max)} mm`,
      count: countWith(products, { ...state, diameterMin: min, diameterMax: max }),
      selected: state.diameterMin === min && state.diameterMax === max,
      range: { min, max },
    });
  }

  return { id: "diameter", label: "Case diameter", options };
}

/**
 * Lug to lug, as an upper bound.
 *
 * This is the one facet the state can only narrow downwards, so the option set runs
 * from the narrowest case in the catalogue upward and the widest case is reached by
 * clearing the facet. That is a limitation of `FilterState` rather than a choice:
 * "48 mm and over" needs a lower bound the state does not have.
 */
function wearGroup(products: Product[], state: FilterState): FacetGroup {
  const bounds = catalogBounds(products);
  const options: FacetOption[] = [];

  for (
    let max = Math.ceil(bounds.lugToLugMin);
    max < bounds.lugToLugMax;
    max += 2
  ) {
    options.push({
      value: String(max),
      label: `Up to ${max} mm`,
      count: countWith(products, { ...state, lugToLugMax: max }),
      selected: state.lugToLugMax === max,
      range: { min: null, max },
    });
  }

  return { id: "lugToLug", label: "Wear", options };
}

/**
 * Price bands.
 *
 * The edges are round numbers, not quantiles: a shopper asking what is under five
 * thousand does not want a sixth of the catalogue. Bands after the first start one
 * cent above the previous band's top so they do not overlap, which makes the labels
 * exact rather than approximate.
 */
const PRICE_EDGES_IN_CENTS = [500_000, 1_000_000, 2_000_000];

function priceGroup(
  products: Product[],
  state: FilterState,
  currency: Currency,
): FacetGroup {
  const bounds = catalogBounds(products);
  const edges = PRICE_EDGES_IN_CENTS.filter(
    (edge) => edge > bounds.priceMinInCents && edge < bounds.priceMaxInCents,
  );

  const bands: Array<{ min: number; max: number; label: string }> = [];
  let lower = 0;
  for (const edge of edges) {
    bands.push({
      min: lower,
      max: edge,
      label:
        lower === 0
          ? `Up to ${formatPrice(edge, currency)}`
          : `${formatPrice(lower, currency)} to ${formatPrice(edge, currency)}`,
    });
    lower = edge + 1;
  }
  bands.push({
    min: lower,
    max: bounds.priceMaxInCents,
    label: `${formatPrice(lower, currency)} and over`,
  });

  return {
    id: "price",
    label: "Price",
    options: bands.map((band) => ({
      value: `${band.min}-${band.max}`,
      label: band.label,
      count: countWith(products, {
        ...state,
        priceMinInCents: band.min,
        priceMaxInCents: band.max,
      }),
      selected: state.priceMinInCents === band.min && state.priceMaxInCents === band.max,
      range: { min: band.min, max: band.max },
    })),
  };
}

/* ── The rail ───────────────────────────────────────────────────────────── */

/**
 * The rail, in the order it appears.
 *
 * Collection first because it is the one question the brand answers rather than
 * the shopper, and the two measurement facets immediately after it because a
 * collector narrows by size before they narrow by colour. Price is last: it is
 * the question asked last, and putting it last keeps it out of the way of the
 * answers that narrow it.
 */
export function facetGroups(
  products: Product[],
  state: FilterState,
  currency: Currency,
): FacetGroup[] {
  return [
    chipGroup(
      products,
      state,
      "collection",
      "Collection",
      collect(products, (p) => [p.collection], [], (value) => value),
    ),
    diameterGroup(products, state),
    wearGroup(products, state),
    chipGroup(
      products,
      state,
      "movement",
      "Movement",
      collect(products, (p) => [p.movement.type], MOVEMENT_VALUES),
    ),
    chipGroup(
      products,
      state,
      "material",
      "Case",
      collect(products, (p) => [p.caseSpec.material], MATERIAL_VALUES),
    ),
    chipGroup(
      products,
      state,
      "strap",
      "Strap",
      collect(products, (p) => p.straps.map((s) => s.type), STRAP_VALUES),
    ),
    chipGroup(products, state, "dial", "Dial", dialValues(products)),
    chipGroup(
      products,
      state,
      "complication",
      "Function",
      collect(products, (p) => p.dials.flatMap((d) => [...d.complications]), COMPLICATION_VALUES),
    ),
    priceGroup(products, state, currency),
  ];
}

/**
 * Set or clear a range facet's bounds.
 *
 * `id` is the facet being written, not the one being skipped, so the same call both
 * applies a band and removes it. This is the one place that knows `FilterState`
 * models diameter and price as a min and a max, and lug to lug as a max alone.
 */
export function setRange(
  state: FilterState,
  id: FacetId,
  min: number | null,
  max: number | null,
): FilterState {
  switch (id) {
    case "diameter":
      return { ...state, diameterMin: min, diameterMax: max };
    case "price":
      return { ...state, priceMinInCents: min, priceMaxInCents: max };
    case "lugToLug":
      return { ...state, lugToLugMax: max };
    default:
      return state;
  }
}
