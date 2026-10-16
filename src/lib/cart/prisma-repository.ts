import "server-only";
import { prisma } from "@/lib/prisma";
import { catalog } from "@/lib/catalog/repository";
import {
  buildVariants,
  defaultSelection,
  findVariant,
  isBuildable,
} from "@/lib/catalog/variants";
import { STOREFRONT_CURRENCY } from "@/lib/format";
import type { Cart, CartLine, Product, VariantSelection } from "@/lib/types";
import type {
  AddItemInput,
  AddItemResult,
  CartRepository,
} from "./repository";

/**
 * The Postgres implementation of the bag seam.
 *
 * The whole file is one idea: a bag line is a *reference to a configuration*,
 * and everything else about it — price, SKU, name, availability — is derived
 * from the product when the bag is read. `toLine` is that derivation, and it is
 * the only place a bag line gets a price.
 *
 * Availability is judged honestly. A line is unavailable when the pairing is no
 * longer built, when the seller has unpublished the reference, or when it is a
 * seeded demo row (which has no seller and was never for sale). The bag shows
 * the line rather than silently dropping it, and checkout refuses while any
 * line is unavailable, so a shopper never pays for something that cannot ship.
 */

/** A bag holds a handful of pieces; ten of one reference is the sane ceiling. */
const MAX_QUANTITY = 10;

/** First dial with the first strap that fits — the same default the product page opens on. */
function resolveSelection(
  product: Product,
  dialId?: string,
  strapId?: string,
): VariantSelection | null {
  /* Neither axis named: the default configuration, provided the product has one. */
  if (!dialId && !strapId) {
    return product.dials.length > 0 && product.straps.length > 0
      ? defaultSelection(product)
      : null;
  }

  const dial = dialId
    ? product.dials.find((d) => d.id === dialId)
    : product.dials[0];
  if (!dial) return null;

  const strap = strapId
    ? product.straps.find((s) => s.id === strapId)
    : product.straps.find((s) => isBuildable(product, s));
  if (!strap || !isBuildable(product, strap)) return null;

  return { dialId: dial.id, strapId: strap.id };
}

function clampQuantity(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(value)));
}

export class PrismaCartRepository implements CartRepository {
  async getCart(accountId: string): Promise<Cart> {
    const rows = await prisma.cartItem.findMany({
      where: { accountId },
      orderBy: { createdAt: "asc" },
    });

    if (rows.length === 0) {
      return {
        lines: [],
        count: 0,
        subtotalInCents: 0,
        currency: STOREFRONT_CURRENCY,
        hasUnavailable: false,
      };
    }

    const products = await catalog.getProductsByIds([
      ...new Set(rows.map((row) => row.productId)),
    ]);
    const byId = new Map(products.map((product) => [product.id, product]));

    const lines: CartLine[] = [];
    for (const row of rows) {
      const product = byId.get(row.productId);
      /* A cascade deletes a bag line with its product, so a missing product here
         means the row outran its product between two queries; skip it rather than
         fail the whole bag. */
      if (!product) continue;

      const variants = buildVariants(product);
      /* The exact pairing the shopper chose. If it is gone — the strap was
         discontinued — the line stays visible but is marked unavailable rather
         than silently reprised as a different, buildable one. */
      const exact = variants.find(
        (entry) => entry.dial.id === row.dialId && entry.strap.id === row.strapId,
      );
      const variant =
        exact ?? findVariant(variants, { dialId: row.dialId, strapId: row.strapId });
      const forSale = product.published !== false && (product.sellerId ?? null) !== null;
      const available = forSale && exact?.available === true;
      const unitPriceInCents = variant.priceInCents;

      lines.push({
        id: row.id,
        productId: product.id,
        slug: product.slug,
        brand: product.brand,
        model: product.model,
        reference: product.reference,
        imageUrl: product.images?.[0] ?? null,
        selection: { dialId: variant.dial.id, strapId: variant.strap.id },
        dialName: variant.dial.name,
        strapName: variant.strap.name,
        unitPriceInCents,
        quantity: row.quantity,
        lineTotalInCents: unitPriceInCents * row.quantity,
        sku: variant.sku,
        available,
      });
    }

    /* The subtotal counts only what can actually be bought, and the flag tells
       the page to say so; a total that quietly included an unavailable line
       would be a lie the shopper only discovers at checkout. */
    const payable = lines.filter((line) => line.available);
    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotalInCents: payable.reduce((sum, line) => sum + line.lineTotalInCents, 0),
      currency: STOREFRONT_CURRENCY,
      hasUnavailable: lines.some((line) => !line.available),
    };
  }

  async addItem(accountId: string, input: AddItemInput): Promise<AddItemResult> {
    const [product] = await catalog.getProductsByIds([input.productId]);
    if (!product) return { ok: false, reason: "not-found" };
    if (product.published === false || (product.sellerId ?? null) === null) {
      return { ok: false, reason: "not-for-sale" };
    }

    const selection = resolveSelection(product, input.dialId, input.strapId);
    if (!selection) return { ok: false, reason: "unbuildable" };

    const quantity = clampQuantity(input.quantity);
    const key = {
      accountId,
      productId: product.id,
      dialId: selection.dialId,
      strapId: selection.strapId,
    };

    await prisma.cartItem.upsert({
      where: { accountId_productId_dialId_strapId: key },
      create: { ...key, quantity },
      /* Increment, then clamp: the unique index makes the existing line the one
         to grow rather than a second row to add. */
      update: { quantity: { increment: quantity } },
    });

    /* The clamp has to be applied to the sum, and Prisma's atomic `increment`
       cannot cap what it adds, so a line pushed past the ceiling is trimmed
       here. The window is one request wide and the outcome is a smaller number,
       never a larger one. */
    const stored = await prisma.cartItem.findUnique({
      where: { accountId_productId_dialId_strapId: key },
    });
    if (stored && stored.quantity > MAX_QUANTITY) {
      await prisma.cartItem.update({
        where: { id: stored.id },
        data: { quantity: MAX_QUANTITY },
      });
    }

    return { ok: true, cart: await this.getCart(accountId) };
  }

  async setQuantity(
    accountId: string,
    itemId: string,
    quantity: number,
  ): Promise<Cart | null> {
    const wanted = clampQuantity(quantity);
    const owned = await prisma.cartItem.findFirst({
      where: { id: itemId, accountId },
      select: { id: true },
    });
    if (!owned) return null;

    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: wanted } });
    return this.getCart(accountId);
  }

  async removeItem(accountId: string, itemId: string): Promise<Cart> {
    await prisma.cartItem.deleteMany({ where: { id: itemId, accountId } });
    return this.getCart(accountId);
  }

  async clear(accountId: string): Promise<void> {
    await prisma.cartItem.deleteMany({ where: { accountId } });
  }
}
