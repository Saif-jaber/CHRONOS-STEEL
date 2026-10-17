import "server-only";
import type {
  BezelType,
  CaseFinish,
  CaseMaterial,
  CaseSpec,
  CrystalType,
  Currency,
  DialOption,
  IndexStyle,
  Movement,
  MovementType,
  Product,
  StrapType,
} from "@/lib/types";
import { isStorageUrl, MAX_IMAGES_PER_LISTING } from "@/lib/storage/r2";

/* ── The resolved shape the repository consumes ─────────────────────────── */

export interface NewListingInput {
  brand: string;
  model: string;
  reference: string;
  collection: string;
  yearIntroduced: number;
  summary: string;
  story: string;
  caseSpec: CaseSpec;
  movement: Movement;
  indexStyle: IndexStyle;
  lume: boolean;
  signature: string;
  sublabel: string | null;
  dial: {
    name: string;
    colorName: string;
    colorHex: string;
    finish: DialOption["finish"];
    priceDeltaInCents: number;
  };
  strap: {
    type: StrapType;
    name: string;
    material: string;
    colorHex: string;
    colorName: string;
    priceDeltaInCents: number;
    widthMm: number;
    stitchColorHex?: string;
  };
  basePriceInCents: number;
  currency: Currency;
  stock: number | null;
  editionSize: number | null;
  featured: boolean;
  tags: string[];
  images: string[];
  sellerId: string;
  /** True when the seller chose to publish immediately; false saves a draft. */
  published: boolean;
}

/* ── Closed sets, mirrored from lib/types.ts ────────────────────────────── */

const CASE_MATERIALS: readonly CaseMaterial[] = [
  "stainless-steel",
  "white-gold",
  "rose-gold",
  "yellow-gold",
  "titanium",
  "platinum",
  "ceramic",
  "bronze",
];
const CASE_FINISHES: readonly CaseFinish[] = ["polished", "brushed", "sandblasted", "bead-blasted"];
const BEZELS: readonly BezelType[] = ["smooth", "fluted", "dive", "tachymeter", "coin-edge", "gem-set"];
const CRYSTALS: readonly CrystalType[] = ["sapphire", "domed-sapphire", "mineral", "acrylic"];
const INDEX_STYLES: readonly IndexStyle[] = ["baton", "roman", "arabic", "dauphine", "mixed", "minimal"];
const MOVEMENT_TYPES: readonly MovementType[] = ["automatic", "manual", "quartz"];
const WINDINGS = ["self-winding", "hand-wound", "quartz"] as const;
const STRAP_TYPES: readonly StrapType[] = ["bracelet", "leather", "rubber", "nato", "mesh", "perforated"];
const DIAL_FINISHES: readonly DialOption["finish"][] = [
  "matte",
  "sunburst",
  "lacquered",
  "guilloche",
  "salmon",
];
const CURRENCIES: readonly Currency[] = ["USD", "EUR", "GBP", "JPY"];

/* ── Field readers. Each returns a value or records one error. ──────────── */

class Reader {
  readonly errors: Record<string, string> = {};

  constructor(private readonly raw: Record<string, unknown>) {}

  fail(field: string, message: string): void {
    if (!this.errors[field]) this.errors[field] = message;
  }

  text(field: string, opts: { min?: number; max?: number; required?: boolean } = {}): string {
    const value = this.raw[field];
    const text = typeof value === "string" ? value.trim() : "";
    const min = opts.min ?? 1;
    const max = opts.max ?? 200;

    if (!text) {
      if (opts.required !== false) this.fail(field, "This field is required.");
      return "";
    }
    if (text.length < min) {
      this.fail(field, `Use at least ${min} characters.`);
    } else if (text.length > max) {
      this.fail(field, `Keep this under ${max} characters.`);
    }
    return text;
  }

  number(
    field: string,
    opts: { min: number; max: number; fallback?: number; required?: boolean },
  ): number {
    const value = this.raw[field];
    if (value === "" || value === null || value === undefined) {
      if (opts.required) this.fail(field, "This field is required.");
      return opts.fallback ?? opts.min;
    }
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) {
      this.fail(field, "Enter a number.");
      return opts.fallback ?? opts.min;
    }
    if (number < opts.min || number > opts.max) {
      this.fail(field, `Enter a value between ${opts.min} and ${opts.max}.`);
    }
    return number;
  }

  optionalInt(field: string, opts: { min: number; max: number }): number | null {
    const value = this.raw[field];
    if (value === "" || value === null || value === undefined) return null;
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number) || !Number.isInteger(number)) {
      this.fail(field, "Enter a whole number.");
      return null;
    }
    if (number < opts.min || number > opts.max) {
      this.fail(field, `Enter a value between ${opts.min} and ${opts.max}.`);
      return null;
    }
    return number;
  }

  oneOf<T extends string>(field: string, allowed: readonly T[], fallback: T): T {
    const value = this.raw[field];
    if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
      return value as T;
    }
    if (value !== undefined && value !== "") this.fail(field, "Choose one of the listed options.");
    return fallback;
  }

  bool(field: string, fallback = false): boolean {
    const value = this.raw[field];
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return fallback;
  }

  hex(field: string, fallback: string): string {
    const value = this.raw[field];
    if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())) {
      return value.trim().toLowerCase();
    }
    if (value !== undefined && value !== "") this.fail(field, "Pick a colour.");
    return fallback;
  }

  tags(field: string): string[] {
    const value = this.raw[field];
    const parts = Array.isArray(value)
      ? value.map((entry) => String(entry))
      : typeof value === "string"
        ? value.split(",")
        : [];
    return parts
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length > 0 && part.length <= 24)
      .slice(0, 8);
  }

  images(): string[] {
    const value = this.raw.images;
    const entries = Array.isArray(value) ? value : [];
    const valid = entries
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(isStorageUrl);

    if (valid.length === 0) {
      this.fail("images", "Add at least one photograph.");
      return [];
    }
    if (valid.length !== entries.length) {
      this.fail("images", "One or more photographs could not be accepted. Re-upload them.");
    }
    return valid.slice(0, MAX_IMAGES_PER_LISTING);
  }
}

/* ── Entry point ────────────────────────────────────────────────────────── */

export type ParseListingResult =
  | { ok: true; input: NewListingInput }
  | { ok: false; errors: Record<string, string> };

export function parseListing(raw: Record<string, unknown>): ParseListingResult {
  const r = new Reader(raw);

  const brand = r.text("brand", { max: 80 });
  const model = r.text("model", { max: 120 });
  const reference = r.text("reference", { max: 40 });
  const collection = r.text("collection", { max: 60 });
  const yearIntroduced = r.number("yearIntroduced", { min: 1900, max: 2100, required: true });
  const summary = r.text("summary", { min: 8, max: 600 });
  const story = r.text("story", { max: 4000, required: false });

  const basePrice = r.number("basePrice", { min: 1, max: 100_000_000, required: true });
  const currency = r.oneOf("currency", CURRENCIES, "USD");

  const diameterMm = r.number("diameterMm", { min: 20, max: 60, fallback: 40 });
  const thicknessMm = r.number("thicknessMm", { min: 4, max: 30, fallback: 12 });
  const lugWidthMm = r.number("lugWidthMm", { min: 10, max: 30, fallback: 20 });
  const lugToLugMm = r.number("lugToLugMm", {
    min: 24,
    max: 80,
    fallback: Math.round((diameterMm + 12) * 10) / 10,
  });
  const material = r.oneOf("material", CASE_MATERIALS, "stainless-steel");
  const finish = r.oneOf("finish", CASE_FINISHES, "brushed");
  const bezel = r.oneOf("bezel", BEZELS, "smooth");
  const crystal = r.oneOf("crystal", CRYSTALS, "sapphire");
  const waterResistanceM = r.number("waterResistanceM", { min: 0, max: 2000, fallback: 100 });

  const movementType = r.oneOf("movementType", MOVEMENT_TYPES, "automatic");
  const caliber = r.text("caliber", { max: 60, required: false });
  const manufacturer = r.text("manufacturer", { max: 80, required: false }) || brand;
  const powerReserveHours = r.optionalInt("powerReserveHours", { min: 0, max: 2000 });
  const frequencyVph = r.optionalInt("frequencyVph", { min: 0, max: 100000 });
  const jewels = r.optionalInt("jewels", { min: 0, max: 200 });
  const components = r.optionalInt("components", { min: 0, max: 2000 });
  const winding = r.oneOf(
    "winding",
    WINDINGS,
    movementType === "automatic" ? "self-winding" : movementType === "manual" ? "hand-wound" : "quartz",
  );

  const dialName = r.text("dialName", { max: 80, required: false }) || "Dial";
  const dialColorName = r.text("dialColorName", { min: 2, max: 40 });
  const dialColorHex = r.hex("dialColorHex", "#1a1a1a");
  const dialFinish = r.oneOf("dialFinish", DIAL_FINISHES, "matte");

  const strapType = r.oneOf("strapType", STRAP_TYPES, "leather");
  const strapName = r.text("strapName", { max: 80, required: false });
  const strapMaterial = r.text("strapMaterial", { max: 40, required: false });
  const strapColorName = r.text("strapColorName", { min: 2, max: 40 });
  const strapColorHex = r.hex("strapColorHex", "#2b2b2b");

  const indexStyle = r.oneOf("indexStyle", INDEX_STYLES, "baton");
  const lume = r.bool("lume", false);

  const stock = r.optionalInt("stock", { min: 0, max: 1_000_000 });
  const editionSize = r.optionalInt("editionSize", { min: 1, max: 1_000_000 });
  const featured = r.bool("featured", false);
  const tags = r.tags("tags");
  const images = r.images();
  const published = r.bool("published", false);

  if (Object.keys(r.errors).length > 0) {
    return { ok: false, errors: r.errors };
  }

  const humanisedStrap = strapType.charAt(0).toUpperCase() + strapType.slice(1);

  return {
    ok: true,
    input: {
      brand,
      model,
      reference,
      collection,
      yearIntroduced,
      summary,
      story: story || summary,
      caseSpec: {
        diameterMm,
        thicknessMm,
        lugToLugMm,
        lugWidthMm,
        material,
        finish,
        bezel,
        crystal,
        waterResistanceM,
      },
      movement: {
        type: movementType,
        caliber: caliber || "Not stated",
        manufacturer,
        powerReserveHours,
        frequencyVph,
        jewels,
        components,
        chronometerDeviationPercent: null,
        winding,
      },
      indexStyle,
      lume,
      signature: brand.toUpperCase(),
      sublabel: collection,
      dial: {
        name: dialName,
        colorName: dialColorName,
        colorHex: dialColorHex,
        finish: dialFinish,
        priceDeltaInCents: 0,
      },
      strap: {
        type: strapType,
        name: strapName || `${strapColorName} ${strapType}`,
        material: strapMaterial || humanisedStrap,
        colorHex: strapColorHex,
        colorName: strapColorName,
        priceDeltaInCents: 0,
        widthMm: lugWidthMm,
      },
      basePriceInCents: Math.round(basePrice * 100),
      currency,
      stock,
      editionSize,
      featured,
      tags,
      images,
      sellerId: String(raw.sellerId ?? ""),
      published,
    },
  };
}

/* ── Slugs. Lowercase, letters and numbers, hyphens between. ────────────── */

export function slugify(value: string): string {
  const base = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || "reference";
}

export function buildProductFromListing(params: {
  id: string;
  slug: string;
  input: NewListingInput;
}): Product {
  const { id, slug, input } = params;
  return {
    id,
    slug,
    brand: input.brand,
    model: input.model,
    reference: input.reference,
    yearIntroduced: input.yearIntroduced,
    collection: input.collection,
    summary: input.summary,
    story: input.story,
    caseSpec: input.caseSpec,
    movement: input.movement,
    dials: [
      {
        id: "dial-1",
        name: input.dial.name,
        colorName: input.dial.colorName,
        colorHex: input.dial.colorHex,
        finish: input.dial.finish,
        priceDeltaInCents: input.dial.priceDeltaInCents,
        complications: [],
        complicationPlacements: {},
      },
    ],
    straps: [
      {
        id: "strap-1",
        type: input.strap.type,
        name: input.strap.name,
        material: input.strap.material,
        colorHex: input.strap.colorHex,
        colorName: input.strap.colorName,
        priceDeltaInCents: input.strap.priceDeltaInCents,
        widthMm: input.strap.widthMm,
        stitchColorHex: input.strap.stitchColorHex,
      },
    ],
    indexStyle: input.indexStyle,
    lume: input.lume,
    signature: input.signature,
    sublabel: input.sublabel,
    basePriceInCents: input.basePriceInCents,
    currency: input.currency,
    stock: input.stock,
    reserved: null,
    editionSize: input.editionSize,
    featured: input.featured,
    tags: input.tags,
    images: input.images,
    sellerId: input.sellerId,
    published: input.published,
  };
}
