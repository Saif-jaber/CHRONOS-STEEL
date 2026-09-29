import type {
  DialOption,
  DialSpec,
  Product,
  ResolvedVariant,
  StrapOption,
  VariantSelection,
} from "../types";

/**
 * Variant resolution.
 *
 * A product declares two independent option axes, dials and straps. Rather than
 * persisting a row per pairing (which drifts the moment a dial is discontinued),
 * variants are *resolved* at read time: only the deltas and the buildability rules
 * are stored, and the price, SKU and availability are derived here.
 *
 * When you move stock to its own table, replace `resolveStock` with a call into
 * your inventory service. Nothing else in the UI changes.
 */

/** Stable, URL-safe, and ordered so the SKU reads dial-then-strap. */
export function variantKey(dialId: string, strapId: string): string {
  return `${dialId}::${strapId}`;
}

export function selectionKey(selection: VariantSelection): string {
  return variantKey(selection.dialId, selection.strapId);
}

/**
 * The one hard physical constraint: a strap only fits a case of matching lug
 * width. This is what makes a configurator honest, since offering a 19 mm strap on
 * a 20 mm case is the kind of detail a collector spots immediately.
 */
export function isBuildable(product: Product, strap: StrapOption): boolean {
  return strap.widthMm === product.caseSpec.lugWidthMm;
}

export function resolveVariantPrice(
  product: Product,
  dial: DialOption,
  strap: StrapOption,
): number {
  return product.basePriceInCents + dial.priceDeltaInCents + strap.priceDeltaInCents;
}

function buildSku(product: Product, dial: DialOption, strap: StrapOption): string {
  const dialCode = dial.id.replace(/^dial-/, "").toUpperCase();
  const strapCode = strap.id.replace(/^strap-/, "").toUpperCase();
  return `${product.reference}-${dialCode}-${strapCode}`;
}

/**
 * Per-variant stock, falling back to product-level stock when the backend has not
 * broken stock down by option. `null` means made to order, which is a real answer
 * for a boutique and renders differently from a zero.
 */
function resolveStock(product: Product, buildable: boolean): number | null {
  if (!buildable) return 0;
  if (product.stock === null) return null;
  return Math.max(0, product.stock - (product.reserved ?? 0));
}

export function leadTimeWeeksFor(product: Product, buildable: boolean): number | null {
  if (!buildable) return null;
  if (resolveStock(product, buildable)! > 0) return 0;
  return product.stock === null ? 10 : 6;
}

/** Every pairing the product can be built into, in a stable display order. */
export function buildVariants(product: Product): ResolvedVariant[] {
  return product.dials.flatMap((dial) =>
    product.straps.map((strap) => {
      const buildable = isBuildable(product, strap);
      return {
        key: variantKey(dial.id, strap.id),
        productId: product.id,
        dial,
        strap,
        priceInCents: resolveVariantPrice(product, dial, strap),
        sku: buildSku(product, dial, strap),
        stock: resolveStock(product, buildable),
        available: buildable,
        leadTimeWeeks: leadTimeWeeksFor(product, buildable),
      } satisfies ResolvedVariant;
    }),
  );
}

/**
 * Look up one pairing, falling back to the first buildable variant if the exact
 * pairing is unavailable, so the PDP can never render an unconfigured state.
 */
export function findVariant(
  variants: ResolvedVariant[],
  selection: VariantSelection,
): ResolvedVariant {
  const exact = variants.find(
    (v) => v.dial.id === selection.dialId && v.strap.id === selection.strapId,
  );
  if (exact) return exact;

  const firstBuildable = variants.find((v) => v.available);
  if (firstBuildable) return firstBuildable;

  return variants[0]!;
}

/**
 * Switching one axis while holding the other is the core of the configurator. When
 * the new choice makes the current pairing unbuildable, 21 mm leather on a 20 mm
 * case, this returns the nearest strap on the same case rather than leaving the
 * shopper on a dead end.
 */
export function reconcileSelection(
  product: Product,
  selection: VariantSelection,
  changed: "dial" | "strap",
): VariantSelection {
  if (changed === "strap") {
    const strap = product.straps.find((s) => s.id === selection.strapId);
    if (strap && isBuildable(product, strap)) return selection;
    const fallback = product.straps.find((s) => isBuildable(product, s));
    if (fallback) return { ...selection, strapId: fallback.id };
  }

  if (changed === "dial") {
    const dial = product.dials.find((d) => d.id === selection.dialId);
    const strap = product.straps.find((s) => s.id === selection.strapId);
    if (dial && strap && isBuildable(product, strap)) return selection;
  }

  return selection;
}

/** The default pairing a visitor lands on: first buildable strap, first dial. */
export function defaultSelection(product: Product): VariantSelection {
  const strap = product.straps.find((s) => isBuildable(product, s)) ?? product.straps[0]!;
  return { dialId: product.dials[0]!.id, strapId: strap.id };
}

/**
 * The variant a product is shown as before anyone has chosen anything. The hero,
 * the collection grid and the product page all open on this, so it has to be one
 * function rather than three hopeful expressions of `variants[0]`.
 *
 * Prefers a buildable pairing, so the drawn watch is one the house actually makes.
 */
export function defaultVariant(product: Product): ResolvedVariant {
  const variants = buildVariants(product);
  return variants.find((v) => v.available) ?? variants[0]!;
}

/**
 * Flatten a dial option plus the product's shared dial furniture into the single
 * object the renderer and the spec table both consume, which is what stops the
 * picture and the spec sheet drifting.
 */
export function resolveDialSpec(product: Product, dial: DialOption): DialSpec {
  return {
    option: dial,
    indexStyle: product.indexStyle,
    complications: dial.complications,
    complicationPlacements: dial.complicationPlacements,
    lume: product.lume,
    signature: product.signature,
    sublabel: product.sublabel,
  };
}

/** Straps the maker will actually fit to this case, in display order. */
export function availableStraps(product: Product): StrapOption[] {
  return product.straps.filter((strap) => isBuildable(product, strap));
}

export function unavailableStraps(product: Product): StrapOption[] {
  return product.straps.filter((strap) => !isBuildable(product, strap));
}

export type StockState = "in-stock" | "low" | "made-to-order" | "unavailable";

export function stockState(variant: ResolvedVariant): StockState {
  if (!variant.available) return "unavailable";
  if (variant.stock === null) return "made-to-order";
  if (variant.stock === 0) return "made-to-order";
  if (variant.stock <= 2) return "low";
  return "in-stock";
}

export const STOCK_COPY: Record<StockState, { label: string; detail: string }> = {
  "in-stock": { label: "In stock", detail: "Ships within two business days." },
  low: { label: "Last units", detail: "Fewer than three on hand." },
  "made-to-order": { label: "Made to order", detail: "Eight to ten weeks from the atelier." },
  unavailable: { label: "Not built", detail: "This pairing is not offered on this case." },
};
