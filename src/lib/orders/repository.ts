import "server-only";
import { PrismaOrderRepository } from "./prisma-repository";
import type { Order } from "@/lib/types";

/** The order seam: receipt fields are snapshotted at placement, and the bag is emptied in the same transaction. */

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
