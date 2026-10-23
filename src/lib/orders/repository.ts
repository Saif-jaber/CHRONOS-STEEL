import "server-only";
import { PrismaOrderRepository } from "./prisma-repository";
import type { Order } from "@/lib/types";

export type CreatePendingOrderResult =
  | { ok: true; order: Order }
  | { ok: false; reason: "empty" | "unavailable" };

/** Orders are written when a Stripe Checkout Session is created, in the
 *  `awaiting_payment` state. Nothing is charged and no stock is drawn down at
 *  that point — the webhook flips the order to `paid` and does the stock work
 *  once Stripe confirms the payment. */
export interface OrderRepository {
  createPendingOrder(accountId: string): Promise<CreatePendingOrderResult>;
  attachStripeSession(orderId: string, sessionId: string): Promise<void>;
  markPaidBySessionId(sessionId: string): Promise<Order | null>;
  markAbandonedBySessionId(sessionId: string): Promise<void>;
  getOrderForAccount(orderId: string, accountId: string): Promise<Order | null>;
  listOrdersForAccount(accountId: string): Promise<Order[]>;
}

export const orders: OrderRepository = new PrismaOrderRepository();
