import "server-only";
import { PrismaCartRepository } from "./prisma-repository";
import type { Cart } from "@/lib/types";

/**
 * The bag seam.
 *
 * One interface, one adapter, exactly like the catalogue and the account store.
 * The thing that makes a bag different from those two is that its *price is not
 * its own*: a line stores only which reference and which dial-and-strap pairing
 * was chosen, and the money is resolved from the product's current options on
 * every read (`lib/catalog/variants.ts`). So the bag, the product page and the
 * collection card all quote one price, because they all resolve it the same way.
 *
 * Adding the same reference in the same configuration twice increments the line
 * rather than stacking duplicate rows. That is enforced by a unique index in the
 * schema, not by a read-then-write here, so two taps that land together still
 * produce one line.
 *
 * There is no in-memory reference implementation, deliberately. The catalogue
 * and account seams ship one because their storage is a plain collection; a bag
 * is a set of constraints — the unique line, the cascade from a deleted
 * account, the transaction that turns a bag into an order — that only exist in
 * the database. A Map would be a second, weaker definition of the same thing.
 */

export interface AddItemInput {
  productId: string;
  /** Omitted means "the default configuration": first dial, first fitting strap. */
  dialId?: string;
  strapId?: string;
  quantity?: number;
}

/** Why an add was refused. Every value has a sentence written for it by the route. */
export type AddRefusal = "not-found" | "not-for-sale" | "unbuildable";

export type AddItemResult =
  | { ok: true; cart: Cart }
  | { ok: false; reason: AddRefusal };

export interface CartRepository {
  getCart(accountId: string): Promise<Cart>;
  addItem(accountId: string, input: AddItemInput): Promise<AddItemResult>;
  /** null when the line is not this account's. */
  setQuantity(accountId: string, itemId: string, quantity: number): Promise<Cart | null>;
  removeItem(accountId: string, itemId: string): Promise<Cart>;
  /** Empties the bag. Used by checkout once the order is written. */
  clear(accountId: string): Promise<void>;
}

/**
 * The live export. Reads and writes run against Postgres through
 * `PrismaCartRepository`; the reference implementation is the schema itself.
 */
export const cart: CartRepository = new PrismaCartRepository();
