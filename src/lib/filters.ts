import type {
  CaseMaterial,
  Complication,
  FilterState,
  MovementType,
  Product,
  SortKey,
  StrapType,
} from "./types";
import { humanise } from "./format";

/**
 * The facet engine.
 *
 * Two rules govern everything below:
 *
 *   1. OR within a facet, AND across facets. Selecting "automatic" and "manual"
 *      widens the movement facet; adding a case material narrows the result.
 *
 *   2. Counts are computed against *every other facet's* current selection, so a
 *      count answers "how many will I get if I click this?" rather than "how many
 *      exist?", which is the only question a shopper is asking.
 *
 * Everything here is a pure function of (products, state), so the same code runs
 * on the server for the first paint and again on the client when the URL changes,
 * and the two cannot disagree.
 */

export type FacetId =
  | "collection"
  | "movement"
  | "material"
  | "strap"
  | "dial"
  | "complication"
  | "diameter"
  | "lugToLug"
  | "price";

export const EMPTY_FILTERS: FilterState = {
  q: "",
  collection: [],
  movement: [],
  material: [],
  strap: [],
  dial: [],
  complication: [],
  diameterMin: null,
  diameterMax: null,
  lugToLugMax: null,
  priceMinInCents: null,
  priceMaxInCents: null,
  sort: "featured",
};

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "diameter-asc", label: "Diameter, narrow to wide" },
  { value: "diameter-desc", label: "Diameter, wide to narrow" },
  { value: "newest", label: "Most recent" },
];

/* ── Facet catalogue ──────────────────────────────────────────────────────
 * Order here is the order they appear in the rail. Measurement facets lead,
 * because a collector narrows by size before they narrow by colour. */

export const MOVEMENT_VALUES: MovementType[] = ["automatic", "manual", "quartz"];

export const MATERIAL_VALUES: CaseMaterial[] = [
  "stainless-steel",
  "titanium",
  "rose-gold",
  "yellow-gold",
  "white-gold",
  "bronze",
  "ceramic",
];

export const STRAP_VALUES: StrapType[] = [
  "bracelet",
  "leather",
  "rubber",
  "nato",
  "mesh",
  "perforated",
];

export const COMPLICATION_VALUES: Complication[] = [
  "date",
  "chronograph",
  "gmt",
  "moonphase",
  "power-reserve",
  "small-seconds",
  "alarm",
];

/**
 * Facets that are multi-select lists, and the accessor that fills their counts.
 *
 * `readonly` on the return type because a dial's complications are already a
 * readonly array; widening them here just to satisfy a signature would be a copy
 * of every complication on every product on every count pass.
 */
const CHIP_FACETS = {
  collection: (p: Product) => [p.collection],
  movement: (p: Product) => [p.movement.type],
  material: (p: Product) => [p.caseSpec.material],
  strap: (p: Product) => p.straps.map((s) => s.type),
  dial: (p: Product) => p.dials.map((d) => d.id),
  complication: (p: Product) => p.dials.flatMap((d) => d.complications),
} satisfies Record<string, (product: Product) => readonly string[]>;

export type ChipFacetId = keyof typeof CHIP_FACETS;

export function isChipFacet(id: FacetId): id is ChipFacetId {
  return id in CHIP_FACETS;
}

/**
 * Selected values for a chip facet, or an empty array for the rest.
 *
 * Exported because the rail has to mark a value as chosen and the chip row has to
 * know which values are already in the URL, and neither should re-implement this
 * switch to find out.
 */
export function selectedValues(state: FilterState, id: FacetId): string[] {
  switch (id) {
    case "collection":
      return state.collection;
    case "movement":
      return state.movement;
    case "material":
      return state.material;
    case "strap":
      return state.strap;
    case "dial":
      return state.dial;
    case "complication":
      return state.complication;
    default:
      return [];
  }
}

/* ── Range bounds, derived from the catalogue rather than hard-coded ──────
 * A slider whose limits do not match the inventory is a lie with two handles. */

export interface CatalogBounds {
  diameterMin: number;
  diameterMax: number;
  lugToLugMin: number;
  lugToLugMax: number;
  priceMinInCents: number;
  priceMaxInCents: number;
}

export function catalogBounds(products: Product[]): CatalogBounds {
  if (products.length === 0) {
    return {
      diameterMin: 0,
      diameterMax: 0,
      lugToLugMin: 0,
      lugToLugMax: 0,
      priceMinInCents: 0,
      priceMaxInCents: 0,
    };
  }
  const diameters = products.map((p) => p.caseSpec.diameterMm);
  const lugToLugs = products.map((p) => p.caseSpec.lugToLugMm);
  const prices = products.map((p) => p.basePriceInCents);
  return {
    diameterMin: Math.min(...diameters),
    diameterMax: Math.max(...diameters),
    lugToLugMin: Math.min(...lugToLugs),
    lugToLugMax: Math.max(...lugToLugs),
    priceMinInCents: Math.min(...prices),
    priceMaxInCents: Math.max(...prices),
  };
}

/* ── Predicates ───────────────────────────────────────────────────────── */

function matchesText(product: Product, query: string): boolean {
  if (query.length === 0) return true;
  const needle = query.toLowerCase();
  // Reference and model are searched alongside the prose, because a collector
  // typing "114" means the calibre or the reference, not the description.
  const haystack = [
    product.brand,
    product.model,
    product.reference,
    product.collection,
    product.summary,
    product.movement.caliber,
    product.movement.manufacturer,
    ...product.dials.map((d) => d.name),
    ...product.dials.flatMap((d) => d.complications),
    ...product.straps.map((s) => s.name),
    ...product.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function inRange(value: number, min: number | null, max: number | null): boolean {
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
}

function chipFacetMatches(product: Product, id: ChipFacetId, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const available: readonly string[] = CHIP_FACETS[id](product);
  // OR within the facet: the product qualifies if it offers *any* selected value.
  return selected.some((value) => available.includes(value));
}

/**
 * The single match predicate. `skip` removes one facet from consideration so
 * counts can answer the "what if I clicked this?" question.
 */
export function productMatches(
  product: Product,
  state: FilterState,
  skip?: FacetId,
): boolean {
  if (!matchesText(product, state.q)) return false;

  if (skip !== "collection" && !chipFacetMatches(product, "collection", state.collection)) {
    return false;
  }
  if (skip !== "movement" && !chipFacetMatches(product, "movement", state.movement)) return false;
  if (skip !== "material" && !chipFacetMatches(product, "material", state.material)) return false;
  if (skip !== "strap" && !chipFacetMatches(product, "strap", state.strap)) return false;
  if (skip !== "dial" && !chipFacetMatches(product, "dial", state.dial)) return false;
  if (
    skip !== "complication" &&
    !chipFacetMatches(product, "complication", state.complication)
  ) {
    return false;
  }

  if (skip !== "diameter") {
    if (!inRange(product.caseSpec.diameterMm, state.diameterMin, state.diameterMax)) {
      return false;
    }
  }
  if (skip !== "lugToLug" && state.lugToLugMax !== null) {
    if (product.caseSpec.lugToLugMm > state.lugToLugMax) return false;
  }
  if (skip !== "price") {
    if (!inRange(product.basePriceInCents, state.priceMinInCents, state.priceMaxInCents)) {
      return false;
    }
  }

  return true;
}

export function applyFilters(products: Product[], state: FilterState): Product[] {
  return sortProducts(
    products.filter((product) => productMatches(product, state)),
    state.sort,
  );
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.basePriceInCents - b.basePriceInCents);
    case "price-desc":
      return sorted.sort((a, b) => b.basePriceInCents - a.basePriceInCents);
    case "diameter-asc":
      return sorted.sort((a, b) => a.caseSpec.diameterMm - b.caseSpec.diameterMm);
    case "diameter-desc":
      return sorted.sort((a, b) => b.caseSpec.diameterMm - a.caseSpec.diameterMm);
    case "newest":
      return sorted.sort((a, b) => b.yearIntroduced - a.yearIntroduced);
    case "featured":
    default:
      // Featured first, then the narrowest case, a collector reads a small
      // diameter as the more considered choice, so it is a better tiebreak
      // than alphabetical order, which is what the sort would otherwise do.
      return sorted.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          a.caseSpec.diameterMm - b.caseSpec.diameterMm,
      );
  }
}

/**
 * Live count per value for one facet, computed against every *other* facet.
 * A value counting zero is still returned, the UI disables it rather than
 * hiding it, because a filter list that reshuffles under the cursor is worse
 * than one that shows you what is unavailable.
 */
export function countFacetValues(
  products: Product[],
  state: FilterState,
  id: ChipFacetId,
): Map<string, number> {
  const counts = new Map<string, number>();
  const selected = selectedValues(state, id);
  const accessor = CHIP_FACETS[id];

  for (const product of products) {
    if (!productMatches(product, state, id)) continue;
    for (const value of new Set(accessor(product))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  // A selected value whose products were all removed by a sibling facet still
  // needs a count, or the active chip loses its number and looks broken.
  for (const value of selected) {
    if (!counts.has(value)) counts.set(value, 0);
  }

  return counts;
}

/* ── URL serialisation ────────────────────────────────────────────────────
 * Filters live in the URL, not in component state, so a filtered view can be
 * shared, bookmarked, and server-rendered. The parse is total: any garbage in
 * the query string falls back to the default rather than throwing. */

/**
 * Splits a comma list and drops tokens that do not match `shape`.
 *
 * When `allowed` is omitted (dial ids and collection names are catalogue-derived,
 * so there is no static list) the token is only shape-checked; an unknown id then
 * matches no product, which keeps the parse total.
 */
function parseList<T extends string>(
  raw: string | null,
  allowed?: readonly T[],
  /* The comma split means a token can never contain a comma, which is why the
     collection pattern below can safely allow spaces and still round-trip. */
  shape: RegExp = /^[a-z0-9-]+$/,
): T[] {
  if (!raw) return [];
  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => shape.test(part));
  if (!allowed) return parts as T[];
  const set = new Set(allowed as readonly string[]);
  return parts.filter((part): part is T => set.has(part));
}

function parseNumber(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * Accepts "min-max", "min-" or "-max". Returns nulls for an open or invalid bound.
 *
 * Anything with more than two parts is rejected outright rather than partially
 * read. "-5-999" is the case that matters: read at face value it becomes "every
 * price up to 9.99", which is a wrong answer rather than a missing one. A query
 * string is user input and this function's contract is that garbage falls back to
 * the default, so an unrecognised shape yields no bounds at all. Measurements and
 * prices are never negative, so nothing legitimate is lost by refusing.
 */
function parseRange(raw: string | null): [number | null, number | null] {
  if (!raw) return [null, null];
  const parts = raw.split("-");
  if (parts.length > 2) return [null, null];
  const [rawMin, rawMax] = parts;
  let min = parseNumber(rawMin ?? null);
  let max = parseNumber(rawMax ?? null);
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  return [min, max];
}

const SORT_KEYS: SortKey[] = SORT_OPTIONS.map((option) => option.value);

export function parseFilters(params: URLSearchParams): FilterState {
  const [diameterMin, diameterMax] = parseRange(params.get("dia"));
  const [priceMinInCents, priceMaxInCents] = parseRange(params.get("price"));
  const sortRaw = params.get("sort");

  return {
    q: params.get("q")?.slice(0, 80) ?? "",
    /* Collection names are brand words, not slugs: "Meridian" has a capital and
     * "Grand Sport" would have a space, so the shape allows both. */
    collection: parseList(params.get("collection"), undefined, /^[a-z0-9][a-z0-9 -]{0,40}$/i),
    movement: parseList(params.get("movement"), MOVEMENT_VALUES),
    material: parseList(params.get("case"), MATERIAL_VALUES),
    strap: parseList(params.get("strap"), STRAP_VALUES),
    dial: parseList(params.get("dial")).filter((id) => /^dial-[a-z0-9-]{1,24}$/.test(id)),
    complication: parseList(params.get("comp"), COMPLICATION_VALUES),
    diameterMin,
    diameterMax,
    lugToLugMax: parseNumber(params.get("lug")),
    priceMinInCents,
    priceMaxInCents,
    sort: SORT_KEYS.includes(sortRaw as SortKey) ? (sortRaw as SortKey) : "featured",
  };
}

/**
 * Serialise back to a query string. Parameters are emitted in a fixed order so
 * the same filter state always produces byte-identical URLs, which keeps
 * `useMemo` deps and Next's router cache from thrashing.
 */
export function filtersToQuery(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.collection.length) params.set("collection", state.collection.join(","));
  if (state.movement.length) params.set("movement", state.movement.join(","));
  if (state.material.length) params.set("case", state.material.join(","));
  if (state.strap.length) params.set("strap", state.strap.join(","));
  if (state.dial.length) params.set("dial", state.dial.join(","));
  if (state.complication.length) params.set("comp", state.complication.join(","));
  if (state.diameterMin !== null || state.diameterMax !== null) {
    params.set("dia", `${state.diameterMin ?? ""}-${state.diameterMax ?? ""}`);
  }
  if (state.lugToLugMax !== null) params.set("lug", String(state.lugToLugMax));
  if (state.priceMinInCents !== null || state.priceMaxInCents !== null) {
    params.set("price", `${state.priceMinInCents ?? ""}-${state.priceMaxInCents ?? ""}`);
  }
  if (state.sort !== "featured") params.set("sort", state.sort);
  return params.toString();
}

export function activeFilterCount(state: FilterState): number {
  return (
    state.collection.length +
    state.movement.length +
    state.material.length +
    state.strap.length +
    state.dial.length +
    state.complication.length +
    (state.diameterMin !== null || state.diameterMax !== null ? 1 : 0) +
    (state.lugToLugMax !== null ? 1 : 0) +
    (state.priceMinInCents !== null || state.priceMaxInCents !== null ? 1 : 0)
  );
}

/** Toggle one value inside one facet, leaving every other facet untouched. */
export function toggleFacetValue(
  state: FilterState,
  id: ChipFacetId,
  value: string,
): FilterState {
  const current = selectedValues(state, id);
  const next = current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];

  switch (id) {
    case "collection":
      return { ...state, collection: next };
    case "movement":
      return { ...state, movement: next as MovementType[] };
    case "material":
      return { ...state, material: next as CaseMaterial[] };
    case "strap":
      return { ...state, strap: next as StrapType[] };
    case "dial":
    case "complication":
      return { ...state, [id]: next } as FilterState;
  }
}

/** One removable chip per active filter, for the row above the grid. */
export interface ActiveChip {
  id: string;
  facet: FacetId | "q";
  value: string;
  label: string;
  detail: string;
}

/** How each chip facet labels its chips, so `activeChips` stays a single pass. */
const CHIP_LABELS: Record<ChipFacetId, { facet: FacetId; detail: string; label: (value: string) => string }> = {
  collection: { facet: "collection", detail: "Collection", label: (value) => value },
  movement: { facet: "movement", detail: "Movement", label: humanise },
  material: { facet: "material", detail: "Case", label: humanise },
  strap: { facet: "strap", detail: "Strap", label: humanise },
  dial: { facet: "dial", detail: "Dial", label: (value) => value.replace("dial-", "") },
  complication: { facet: "complication", detail: "Function", label: humanise },
};

export function activeChips(state: FilterState, bounds: CatalogBounds): ActiveChip[] {
  const chips: ActiveChip[] = [];

  if (state.q) {
    chips.push({ id: "q", facet: "q", value: state.q, label: `“${state.q}”`, detail: "Search" });
  }

  for (const id of Object.keys(CHIP_LABELS) as ChipFacetId[]) {
    const spec = CHIP_LABELS[id];
    for (const value of selectedValues(state, id)) {
      chips.push({
        id: `${spec.facet}:${value}`,
        facet: spec.facet,
        value,
        label: spec.label(value),
        detail: spec.detail,
      });
    }
  }

  if (state.diameterMin !== null || state.diameterMax !== null) {
    const lo = state.diameterMin ?? bounds.diameterMin;
    const hi = state.diameterMax ?? bounds.diameterMax;
    chips.push({
      id: "diameter",
      facet: "diameter",
      value: "diameter",
      label: `${lo}–${hi} mm`,
      detail: "Diameter",
    });
  }
  if (state.lugToLugMax !== null) {
    chips.push({
      id: "lugToLug",
      facet: "lugToLug",
      value: String(state.lugToLugMax),
      label: `Under ${state.lugToLugMax} mm`,
      detail: "Lug to lug",
    });
  }
  if (state.priceMinInCents !== null || state.priceMaxInCents !== null) {
    const lo = state.priceMinInCents ?? bounds.priceMinInCents;
    const hi = state.priceMaxInCents ?? bounds.priceMaxInCents;
    chips.push({
      id: "price",
      facet: "price",
      value: "price",
      label: `${Math.round(lo / 100).toLocaleString("en-US")}–${Math.round(hi / 100).toLocaleString("en-US")}`,
      detail: "Price",
    });
  }

  return chips;
}

/** Remove one chip by id. `q` clears the search term; facets clear one value. */
export function removeChip(state: FilterState, chip: ActiveChip): FilterState {
  if (chip.facet === "q") return { ...state, q: "" };
  if (isChipFacet(chip.facet)) return toggleFacetValue(state, chip.facet, chip.value);

  switch (chip.facet) {
    case "diameter":
      return { ...state, diameterMin: null, diameterMax: null };
    case "lugToLug":
      return { ...state, lugToLugMax: null };
    case "price":
      return { ...state, priceMinInCents: null, priceMaxInCents: null };
    default:
      return state;
  }
}
