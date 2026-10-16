import "server-only";
import { PrismaOrderRepository } from "./prisma-repository";
import type { Order } from "@/lib/types";

/**
 * The order seam.
 *
 * An order is the moment the bag becomes history. Everything a receipt needs —
 * the names, the reference, the SKU, the unit price — is copied onto the order
 * at this moment, because the catalogue underneath it will keep changing and a
 * receipt that changes is not a receipt. The bag is emptied in the same
 * transaction that writes the order, so a failure on either side leaves neither.
 *
 * There is no reference implementation for the same reason the bag has none:
 * atomicity is the whole point, and a Map cannot express it.
 */

export type PlaceOrderResult =
  | { ok: true; order: Order }
  | { ok: false; reason: "empty" | "unavailable" };

export interface OrderRepository {
  /** Turns the signed-in account's bag into an order and empties the bag. */
  placeOrder(accountId: string): Promise<PlaceOrderResult>;
  /** null when the order does not exist or belongs to someone else. */
  getOrderForAccount(orderId: string, accountId: string): Promise<Order | null>;
  listOrdersForAccount(accountId: string): Promise<Order[]>;
}

export const orders: OrderRepository = new PrismaOrderRepository();
