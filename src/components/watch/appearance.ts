import type { CaseFinish, CaseMaterial, Complication, IndexStyle, StrapType } from "@/lib/types";

/**
 * Material appearance tables for the SVG renderer.
 *
 * These are *product appearance data*, not design tokens, the same category as
 * the `colorHex` that arrives from your database for a dial. They are kept in
 * one file, away from the `@theme` block in `globals.css`, so it stays obvious
 * which colours are the interface and which describe an object.
 *
 * Every value below is an approximation of how these alloys actually behave
 * under light: steel is cool and narrow in its highlight, gold is warm and
 * broad, ceramic is a matte that barely moves at all.
 */

export interface MetalAppearance {
  /** Gradient stops, light edge to dark edge. */
  light: string;
  mid: string;
  dark: string;
  /** Reflection sheen laid over the case flank. */
  sheen: string;
  /** Index and hand colour sitting on a dial under this metal. */
  furniture: string;
  /** true when indices and hands are filled with lume rather than metal. */
  furnitureIsLume: boolean;
}

const STEEL: MetalAppearance = {
  light: "#E4E2DC",
  mid: "#B9B6AE",
  dark: "#85827B",
  sheen: "#F2F0EA",
  furniture: "#EDEBE5",
  furnitureIsLume: false,
};

const GOLD: MetalAppearance = {
  light: "#E8C88C",
  mid: "#C6A165",
  dark: "#93743F",
  sheen: "#F4DCAC",
  furniture: "#F0E2C4",
  furnitureIsLume: false,
};

const TITANIUM: MetalAppearance = {
  light: "#C6C3BC",
  mid: "#9C9992",
  dark: "#6E6B65",
  sheen: "#D6D3CC",
  furniture: "#E4E1DA",
  furnitureIsLume: false,
};

const CERAMIC: MetalAppearance = {
  light: "#4E5052",
  mid: "#35373A",
  dark: "#222426",
  sheen: "#5A5D60",
  furniture: "#D8D5CE",
  furnitureIsLume: false,
};

const BRONZE: MetalAppearance = {
  light: "#C09A63",
  mid: "#9A7444",
  dark: "#6E4F2C",
  sheen: "#D8B27C",
  furniture: "#DCCBA8",
  furnitureIsLume: false,
};

export const MATERIAL_APPEARANCE: Record<CaseMaterial, MetalAppearance> = {
  "stainless-steel": STEEL,
  titanium: TITANIUM,
  ceramic: CERAMIC,
  bronze: BRONZE,
  "white-gold": { ...GOLD, light: "#E4E2DD", mid: "#C4C0B8", dark: "#979289" },
  "rose-gold": { ...GOLD, light: "#EBC3A4", mid: "#C9976F", dark: "#9C6B4E" },
  "yellow-gold": GOLD,
  platinum: { ...STEEL, light: "#DFDDD8", mid: "#B2AFA8", dark: "#807D77" },
};

/** Brushed and sandblasted cases scatter light instead of reflecting it. */
export function finishTone(
  material: CaseMaterial,
  finish: CaseFinish,
): MetalAppearance {
  const base = MATERIAL_APPEARANCE[material];
  if (finish === "polished") return base;
  // Scattering pulls the stops toward the mid tone and kills the sheen.
  return {
    ...base,
    light: base.mid,
    dark: base.dark,
    sheen: base.mid,
  };
}

/* ── Dial finishes ───────────────────────────────────────────────────────
 * A sunburst dial is a radial sheen that gets brighter as it rotates toward
 * the light. Guilloché is a crosshatch. Lacquer is a single specular band.
 * Matte is flat, and the only one of the four with no gradient at all. */

export interface DialAppearance {
  /** Base fill. */
  base: string;
  /** Optional overlay stops, near → far from centre. */
  sheenStops: Array<{ offset: string; color: string; opacity: number }> | null;
  /** Text colour that clears 4.5:1 on `base`. */
  ink: string;
  /** Minute-track and printing colour. */
  printing: string;
  /** Index metal, which is not always the dial's ink. */
  furniture: string;
  /** The dial reads as dark, so lume and furniture go light. */
  isDark: boolean;
}

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function dialAppearance(
  colorHex: string,
  finish: "matte" | "sunburst" | "lacquered" | "guilloche" | "salmon",
): DialAppearance {
  const isDark = luminance(colorHex) < 0.42;

  let sheenStops: DialAppearance["sheenStops"] = null;
  if (finish === "sunburst") {
    // Off-centre, because a perfectly centred sunburst reads as a vignette.
    sheenStops = [
      { offset: "18%", color: "#FFFFFF", opacity: isDark ? 0.16 : 0.3 },
      { offset: "52%", color: colorHex, opacity: 0 },
      { offset: "100%", color: "#000000", opacity: isDark ? 0.3 : 0.12 },
    ];
  } else if (finish === "guilloche") {
    sheenStops = [
      { offset: "30%", color: "#FFFFFF", opacity: isDark ? 0.09 : 0.16 },
      { offset: "70%", color: "#000000", opacity: isDark ? 0.16 : 0.07 },
    ];
  } else if (finish === "lacquered" || finish === "salmon") {
    sheenStops = [
      { offset: "12%", color: "#FFFFFF", opacity: 0.26 },
      { offset: "42%", color: colorHex, opacity: 0 },
      { offset: "100%", color: "#000000", opacity: isDark ? 0.22 : 0.1 },
    ];
  }

  return {
    base: colorHex,
    sheenStops,
    ink: isDark ? "#EDEAE2" : "#1A1A18",
    printing: isDark ? "rgba(237,234,226,0.72)" : "rgba(26,26,24,0.66)",
    furniture: isDark ? "#DCD8CE" : "#2A2A28",
    isDark,
  };
}

/* ── Strap appearance ─────────────────────────────────────────────────── */

export interface StrapAppearance {
  base: string;
  light: string;
  dark: string;
  /** "links" draws discrete bracelet links; "smooth" draws a solid band. */
  construction: "links" | "smooth" | "weave" | "mesh";
  /** Perforation holes for rally straps. */
  perforations: boolean;
  stitch: boolean;
  /** Thread colour, only meaningful when `stitch` is true. */
  stitchColor: string;
}

export function strapAppearance(
  type: StrapType,
  colorHex: string,
  stitchColorHex?: string,
): StrapAppearance {
  const stitch = type === "leather" || type === "perforated";
  // Default thread is a warm contrast against the hide; a strap can override it.
  const stitchColor = stitchColorHex ?? "#C9A227";

  switch (type) {
    case "bracelet":
      return {
        base: colorHex,
        light: lighten(colorHex, 0.16),
        dark: darken(colorHex, 0.2),
        construction: "links",
        perforations: false,
        stitch: false,
        stitchColor,
      };
    case "mesh":
      return {
        base: colorHex,
        light: lighten(colorHex, 0.2),
        dark: darken(colorHex, 0.24),
        construction: "mesh",
        perforations: false,
        stitch: false,
        stitchColor,
      };
    case "nato":
      return {
        base: colorHex,
        light: lighten(colorHex, 0.12),
        dark: darken(colorHex, 0.16),
        construction: "weave",
        perforations: false,
        stitch: false,
        stitchColor,
      };
    case "perforated":
      return {
        base: colorHex,
        light: lighten(colorHex, 0.14),
        dark: darken(colorHex, 0.18),
        construction: "smooth",
        perforations: true,
        stitch: true,
        stitchColor,
      };
    case "leather":
    case "rubber":
    default:
      return {
        base: colorHex,
        light: lighten(colorHex, 0.13),
        dark: darken(colorHex, 0.18),
        construction: "smooth",
        perforations: false,
        stitch,
        stitchColor,
      };
  }
}

/* ── Colour maths, kept local so the renderer has no dependencies ─────── */

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function lighten(hex: string, amount: number): string {
  return mix(hex, "#FFFFFF", amount);
}

export function darken(hex: string, amount: number): string {
  return mix(hex, "#000000", amount);
}

export function mix(a: string, b: string, weight: number): string {
  const parse = (value: string) => {
    const clean = value.replace("#", "");
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ] as const;
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const w = clamp(weight);
  const mixChannel = (x: number, y: number) => Math.round(x + (y - x) * w);
  const toHex = (value: number) => clamp(value, 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(mixChannel(r1, r2))}${toHex(mixChannel(g1, g2))}${toHex(mixChannel(b1, b2))}`;
}

/** The lume compound, and the colour it glows when charged. */
export const LUME_FILL = "#D8F2D0";
export const LUME_GLOW = "#8CF5A8";

/* ── Index glyph metrics ──────────────────────────────────────────────── */

export const INDEX_STYLE_LABEL: Record<IndexStyle, string> = {
  baton: "Applied baton",
  roman: "Roman numeral",
  arabic: "Printed Arabic",
  dauphine: "Faceted dauphine",
  mixed: "Baton with Arabic quarters",
  minimal: "Four batons",
};

export const COMPLICATION_LABEL: Record<Complication, string> = {
  date: "Date",
  chronograph: "Chronograph",
  moonphase: "Moonphase",
  gmt: "Second time zone",
  "power-reserve": "Power reserve",
  "small-seconds": "Small seconds",
  alarm: "Alarm",
};
