import { describe, expect, it } from "vitest";
import {
  STOREFRONT_CURRENCY,
  countWord,
  cx,
  formatDeviation,
  formatFrequency,
  formatJewels,
  formatMm,
  formatMmWithUnit,
  formatPowerReserve,
  formatPrice,
  formatPriceDelta,
  formatWaterResistance,
  humanise,
  pluralise,
  slugToTitle,
} from "@/lib/format";

const MINUS = "\u2212";
const PLUS_MINUS = "\u00b1";
const SPACE = "\u202f";

describe("storefront currency", () => {
  it("presents in pounds", () => {
    expect(STOREFRONT_CURRENCY).toBe("GBP");
  });
});

describe("formatPrice", () => {
  it("drops the cents for retail", () => {
    expect(formatPrice(485000, "USD")).toBe("$4,850");
    expect(formatPrice(1450000, "USD")).toBe("$14,500");
  });

  it("handles zero without a decimal", () => {
    expect(formatPrice(0, "USD")).toBe("$0");
  });
});

describe("formatPriceDelta", () => {
  it("reads a zero delta as included", () => {
    expect(formatPriceDelta(0, "USD")).toBe("Included");
  });

  it("keeps the sign on a paid upgrade", () => {
    expect(formatPriceDelta(20000, "USD")).toBe("+$200");
    expect(formatPriceDelta(-5000, "USD")).toBe(`${MINUS}$50`);
  });
});

describe("measurements", () => {
  it("states millimetres to one decimal", () => {
    expect(formatMm(39)).toBe("39.0");
    expect(formatMmWithUnit(39)).toBe(`39.0${SPACE}mm`);
  });

  it("states water resistance in metres", () => {
    expect(formatWaterResistance(50)).toBe(`50${SPACE}m`);
  });
});

describe("optional movement figures", () => {
  it("read a withheld figure as words", () => {
    expect(formatPowerReserve(null)).toBe("Not stated");
    expect(formatFrequency(null)).toBe("Not stated");
    expect(formatDeviation(null)).toBe("Not stated");
    expect(formatJewels(null)).toBe("Not stated");
  });

  it("format a figure when it exists", () => {
    expect(formatPowerReserve(56)).toBe("56 h");
    expect(formatFrequency(28800)).toBe("28,800 vph");
    expect(formatDeviation(0.5)).toBe(`${PLUS_MINUS}0.5 s/day`);
    expect(formatJewels(27)).toBe("27");
  });
});

describe("humanisation", () => {
  it("spaces a hyphenated slug fragment", () => {
    expect(humanise("white-gold")).toBe("White gold");
  });

  it("title-cases a slug", () => {
    expect(slugToTitle("meridian-38")).toBe("Meridian 38");
  });
});

describe("pluralise", () => {
  it("uses the singular for one", () => {
    expect(pluralise(1, "reference")).toBe("reference");
  });

  it("pluralises otherwise, and accepts an override", () => {
    expect(pluralise(2, "reference")).toBe("references");
    expect(pluralise(0, "reference")).toBe("references");
    expect(pluralise(2, "datum", "data")).toBe("data");
  });
});

describe("countWord", () => {
  it("spells out the teens", () => {
    expect(countWord(12)).toBe("twelve");
    expect(countWord(19)).toBe("nineteen");
  });

  it("falls back to digits elsewhere", () => {
    expect(countWord(20)).toBe("20");
  });
});

describe("cx", () => {
  it("joins truthy parts and drops the rest", () => {
    expect(cx("a", false, null, undefined, "b")).toBe("a b");
  });
});
