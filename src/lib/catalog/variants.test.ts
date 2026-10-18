import { describe, expect, it } from "vitest";
import type { DialOption, Product, StrapOption } from "@/lib/types";
import {
  availableStraps,
  buildVariants,
  defaultSelection,
  defaultVariant,
  findVariant,
  isBuildable,
  leadTimeWeeksFor,
  reconcileSelection,
  resolveVariantPrice,
  selectionKey,
  stockState,
  unavailableStraps,
  variantKey,
} from "@/lib/catalog/variants";

const LUG_WIDTH = 19;

function dial(id: string, priceDeltaInCents: number): DialOption {
  return {
    id,
    name: id,
    colorName: "Silver",
    colorHex: "#c0c0c0",
    finish: "matte",
    priceDeltaInCents,
    complications: [],
    complicationPlacements: {},
  };
}

function strap(
  id: string,
  widthMm: number,
  priceDeltaInCents: number,
): StrapOption {
  return {
    id,
    type: "leather",
    name: id,
    material: "Leather",
    colorHex: "#2b2b2b",
    colorName: "Black",
    priceDeltaInCents,
    widthMm,
  };
}

/** One dial on a 19 mm case, plus two straps that do not fit it. */
function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p-test",
    slug: "test-38",
    brand: "Chronos & Steel",
    model: "Test 38",
    reference: "CS-999",
    yearIntroduced: 2020,
    collection: "Test",
    summary: "A reference that exists only in the tests.",
    story: "Story.",
    caseSpec: {
      diameterMm: 38,
      thicknessMm: 9.1,
      lugToLugMm: 45.2,
      lugWidthMm: LUG_WIDTH,
      material: "stainless-steel",
      finish: "polished",
      bezel: "smooth",
      crystal: "domed-sapphire",
      waterResistanceM: 50,
    },
    movement: {
      type: "automatic",
      caliber: "CS-1",
      manufacturer: "Chronos & Steel",
      powerReserveHours: 56,
      frequencyVph: 28800,
      jewels: 27,
      components: 231,
      chronometerDeviationPercent: null,
      winding: "self-winding",
    },
    dials: [dial("dial-silver", 0), dial("dial-black", 15000)],
    straps: [
      strap("strap-steel", LUG_WIDTH, 0),
      strap("strap-leather", 22, 20000),
      strap("strap-nato", 18, -5000),
    ],
    indexStyle: "baton",
    lume: true,
    signature: "CHRONOS & STEEL",
    sublabel: null,
    basePriceInCents: 100000,
    currency: "USD",
    stock: 6,
    reserved: 1,
    editionSize: null,
    featured: false,
    tags: [],
    ...overrides,
  };
}

describe("variant keys", () => {
  it("reads dial then strap", () => {
    expect(variantKey("dial-silver", "strap-steel")).toBe("dial-silver::strap-steel");
  });

  it("derives from a selection the same way", () => {
    expect(selectionKey({ dialId: "dial-black", strapId: "strap-steel" })).toBe(
      "dial-black::strap-steel",
    );
  });
});

describe("isBuildable", () => {
  it("requires the strap width to match the lug width", () => {
    const product = makeProduct();
    const matching = product.straps[0]!;
    const wide = product.straps[1]!;

    expect(isBuildable(product, matching)).toBe(true);
    expect(isBuildable(product, wide)).toBe(false);
  });
});

describe("resolveVariantPrice", () => {
  it("adds both deltas to the base price", () => {
    const product = makeProduct();
    expect(resolveVariantPrice(product, product.dials[0]!, product.straps[0]!)).toBe(100000);
    expect(resolveVariantPrice(product, product.dials[1]!, product.straps[1]!)).toBe(135000);
    expect(resolveVariantPrice(product, product.dials[0]!, product.straps[2]!)).toBe(95000);
  });
});

describe("buildVariants", () => {
  it("pairs every dial with every strap", () => {
    const product = makeProduct();
    expect(buildVariants(product)).toHaveLength(product.dials.length * product.straps.length);
  });

  it("marks only the strap that fits the case as available", () => {
    const product = makeProduct();
    const variants = buildVariants(product);
    const available = variants.filter((variant) => variant.available);

    expect(available).toHaveLength(product.dials.length);
    expect(available.every((variant) => variant.strap.widthMm === LUG_WIDTH)).toBe(true);
  });

  it("builds a reference-dial-strap SKU", () => {
    const product = makeProduct();
    const variant = findVariant(buildVariants(product), {
      dialId: "dial-black",
      strapId: "strap-steel",
    });

    expect(variant.sku).toBe("CS-999-BLACK-STEEL");
  });

  it("reserves stock for buildable pairings and zeroes the rest", () => {
    const product = makeProduct();
    const variants = buildVariants(product);

    expect(variants[0]!.stock).toBe(5);
    expect(variants[1]!.stock).toBe(0);
  });

  it("reports made-to-order when the product holds no stock", () => {
    const product = makeProduct({ stock: null, reserved: null });
    const variants = buildVariants(product);

    expect(variants[0]!.stock).toBeNull();
  });
});

describe("stockState", () => {
  it("reads a healthy count as in stock", () => {
    const product = makeProduct({ stock: 5, reserved: 0 });
    expect(stockState(defaultVariant(product))).toBe("in-stock");
  });

  it("reads two or fewer as low", () => {
    const product = makeProduct({ stock: 2, reserved: 0 });
    expect(stockState(defaultVariant(product))).toBe("low");
  });

  it("reads a made-to-order product as such", () => {
    expect(stockState(defaultVariant(makeProduct({ stock: null })))).toBe("made-to-order");
    expect(stockState(defaultVariant(makeProduct({ stock: 0, reserved: 0 })))).toBe("made-to-order");
  });

  it("never offers a pairing the case cannot take", () => {
    const product = makeProduct();
    const variants = buildVariants(product);
    const unbuildable = variants.find((variant) => !variant.available)!;

    expect(stockState(unbuildable)).toBe("unavailable");
  });
});

describe("leadTimeWeeksFor", () => {
  it("ships same-day when it is on the shelf", () => {
    expect(leadTimeWeeksFor(makeProduct({ stock: 5, reserved: 0 }), true)).toBe(0);
  });

  it("waits ten weeks for made to order", () => {
    expect(leadTimeWeeksFor(makeProduct({ stock: null }), true)).toBe(10);
  });

  it("waits six weeks when the shelf is empty", () => {
    expect(leadTimeWeeksFor(makeProduct({ stock: 0, reserved: 0 }), true)).toBe(6);
  });

  it("has no lead time for a pairing that cannot be built", () => {
    expect(leadTimeWeeksFor(makeProduct(), false)).toBeNull();
  });
});

describe("selection defaults", () => {
  it("picks the first dial and the first fitting strap", () => {
    const product = makeProduct();
    expect(defaultSelection(product)).toEqual({ dialId: "dial-silver", strapId: "strap-steel" });
  });

  it("falls back to any strap when none fits the case", () => {
    const product = makeProduct({ straps: [strap("strap-leather", 22, 0)] });
    expect(defaultSelection(product)).toEqual({ dialId: "dial-silver", strapId: "strap-leather" });
  });

  it("opens the page on an available variant", () => {
    const variant = defaultVariant(makeProduct());
    expect(variant.available).toBe(true);
    expect(variant.strap.widthMm).toBe(LUG_WIDTH);
  });
});

describe("findVariant", () => {
  it("returns the exact pairing when it exists", () => {
    const product = makeProduct();
    const variant = findVariant(buildVariants(product), {
      dialId: "dial-black",
      strapId: "strap-steel",
    });

    expect(variant.dial.id).toBe("dial-black");
    expect(variant.strap.id).toBe("strap-steel");
  });

  it("falls back to the first available pairing", () => {
    const product = makeProduct();
    const variant = findVariant(buildVariants(product), {
      dialId: "dial-gone",
      strapId: "strap-gone",
    });

    expect(variant.available).toBe(true);
  });
});

describe("reconcileSelection", () => {
  it("replaces a strap that does not fit with one that does", () => {
    const product = makeProduct();
    const reconciled = reconcileSelection(
      product,
      { dialId: "dial-silver", strapId: "strap-leather" },
      "strap",
    );

    expect(reconciled.strapId).toBe("strap-steel");
  });

  it("keeps a valid dial change", () => {
    const product = makeProduct();
    const selection = { dialId: "dial-black", strapId: "strap-steel" };
    expect(reconcileSelection(product, selection, "dial")).toEqual(selection);
  });
});

describe("strap lists", () => {
  it("splits straps by whether they fit the case", () => {
    const product = makeProduct();

    expect(availableStraps(product).map((entry) => entry.id)).toEqual(["strap-steel"]);
    expect(unavailableStraps(product).map((entry) => entry.id)).toEqual([
      "strap-leather",
      "strap-nato",
    ]);
  });
});
