import { describe, expect, it } from "vitest";
import { checkoutTotalInCents, toCheckoutLines } from "./line-items";

const bagLine = {
  brand: "Meridian",
  model: "38",
  dialName: "Sector",
  strapName: "Steel bracelet",
  sku: "CS-380-SILVER-STEEL-38",
  unitPriceInCents: 485000,
  quantity: 1,
  available: true,
};

describe("toCheckoutLines", () => {
  it("maps a bag line into a Stripe line item", () => {
    const [line] = toCheckoutLines([bagLine]);

    expect(line).toEqual({
      name: "Meridian 38",
      description:
        "Sector dial \u00b7 Steel bracelet strap \u00b7 SKU CS-380-SILVER-STEEL-38",
      unitAmountInCents: 485000,
      quantity: 1,
    });
  });

  it("drops lines that can no longer be ordered", () => {
    const lines = toCheckoutLines([
      bagLine,
      { ...bagLine, sku: "CS-GONE", available: false },
    ]);

    expect(lines).toHaveLength(1);
    expect(lines[0]?.name).toBe("Meridian 38");
  });

  it("keeps order lines, which carry no availability flag", () => {
    const { available: _available, ...orderLine } = bagLine;

    expect(toCheckoutLines([orderLine])).toHaveLength(1);
  });

  it("multiplies nothing; each line carries its own quantity", () => {
    const lines = toCheckoutLines([{ ...bagLine, quantity: 3 }]);

    expect(lines[0]?.quantity).toBe(3);
    expect(lines[0]?.unitAmountInCents).toBe(485000);
  });
});

describe("checkoutTotalInCents", () => {
  it("sums unit price times quantity across lines", () => {
    const lines = toCheckoutLines([
      bagLine,
      { ...bagLine, sku: "CS-B", unitPriceInCents: 10000, quantity: 2 },
    ]);

    expect(checkoutTotalInCents(lines)).toBe(485000 + 20000);
  });

  it("is zero for an empty bag", () => {
    expect(checkoutTotalInCents([])).toBe(0);
  });
});
