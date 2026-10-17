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

/** Every distinct value a facet can take: declared order first, then catalogue order. */
function collect(
  products: Product[],
  pick: (product: Product) => readonly string[],
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

/** Dials keep the catalogue's own name and colour swatch. */
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

/** How many products a hypothetical state would return. The facet is not skipped,
 * because its new bounds are already in the state being counted. */
function countWith(products: Product[], hypothetical: FilterState): number {
  return products.filter((product) => productMatches(product, hypothetical)).length;
}

/** Case diameter, in inclusive millimetre bands of two. */
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

/** Lug to lug as an upper bound only; `FilterState` has no lower bound. */
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

/** Round-number price edges; each band starts one cent above the previous top. */
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

/** The rail, in the order it appears. */
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
      collect(products, (p) => p.dials.flatMap((d) => d.complications), COMPLICATION_VALUES),
    ),
    priceGroup(products, state, currency),
  ];
}

/** Set or clear a range facet's bounds. `id` is the facet being written. */
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
