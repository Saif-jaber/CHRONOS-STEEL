import "server-only";
import { PrismaCartRepository } from "./prisma-repository";
import type { Cart } from "@/lib/types";

/** The bag seam: a line stores only a configuration reference; price is resolved from the product on every read. */

export interface AddItemInput {
  productId: string;
  /** Omitted means "the default configuration": first dial, first fitting strap. */
  dialId?: string;
  strapId?: string;
  quantity?: number;
}

/** Why an add was refused. */
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

/** Live export: Postgres via `PrismaCartRepository`. */
export const cart: CartRepository = new PrismaCartRepository();
