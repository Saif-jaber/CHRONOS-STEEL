/** The neutral shape a Stripe line item is built from. Deliberately free of
 *  Stripe types so it can be unit-tested without the SDK. */

export interface CheckoutLine {
  name: string;
  description: string;
  unitAmountInCents: number;
  quantity: number;
}

/** Anything with the fields a receipt line carries: a bag line (which also has
 *  `available`) or an order line (which does not, because it is already
 *  snapshotted as payable). */
export interface CheckoutLineSource {
  brand: string;
  model: string;
  dialName: string;
  strapName: string;
  sku: string;
  unitPriceInCents: number;
  quantity: number;
  available?: boolean;
}

/** Only payable lines are chargeable. A bag with an unavailable line is refused
 *  by the checkout route before this runs, so this is a guard, not a filter the
 *  caller should rely on. */
export function toCheckoutLines(lines: CheckoutLineSource[]): CheckoutLine[] {
  return lines
    .filter((line) => line.available !== false)
    .map((line) => ({
      name: `${line.brand} ${line.model}`,
      description: `${line.dialName} dial \u00b7 ${line.strapName} strap \u00b7 SKU ${line.sku}`,
      unitAmountInCents: line.unitPriceInCents,
      quantity: line.quantity,
    }));
}

/** What Stripe will charge, in minor units. */
export function checkoutTotalInCents(lines: CheckoutLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitAmountInCents * line.quantity, 0);
}
