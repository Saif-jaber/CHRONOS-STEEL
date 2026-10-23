import "server-only";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { cart } from "@/lib/cart/repository";
import type { Order, OrderLine } from "@/lib/types";
import type { CreatePendingOrderResult, OrderRepository } from "./repository";

/* The database row, including the columns the public `Order` type does not
   expose (the owning account, the session id). */
interface OrderRow {
  id: string;
  number: string;
  accountId: string;
  status: string;
  currency: string;
  subtotalInCents: number;
  totalInCents: number;
  placedAt: Date;
  paidAt: Date | null;
  stripeSessionId: string | null;
  items: OrderItemRow[];
}

interface OrderItemRow {
  productId: string | null;
  slug: string;
  brand: string;
  model: string;
  reference: string;
  dialName: string;
  strapName: string;
  sku: string;
  unitPriceInCents: number;
  quantity: number;
  imageUrl: string | null;
}

const orderInclude = { items: true } as const;

function toLine(item: OrderItemRow): OrderLine {
  return {
    productId: item.productId,
    slug: item.slug,
    brand: item.brand,
    model: item.model,
    reference: item.reference,
    dialName: item.dialName,
    strapName: item.strapName,
    sku: item.sku,
    unitPriceInCents: item.unitPriceInCents,
    quantity: item.quantity,
    imageUrl: item.imageUrl,
  };
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    currency: row.currency as Order["currency"],
    subtotalInCents: row.subtotalInCents,
    totalInCents: row.totalInCents,
    placedAt: row.placedAt.toISOString(),
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    lines: row.items.map(toLine),
  };
}

/* Human-facing order code, e.g. "CS-20261018-XG2V". Order of the date is the
   only thing a customer needs to read; the four characters are a tie-break so
   two orders placed in the same minute do not collide. */
function orderNumber(at: Date): string {
  const stamp = [
    at.getFullYear(),
    String(at.getMonth() + 1).padStart(2, "0"),
    String(at.getDate()).padStart(2, "0"),
  ].join("");
  let code = "";
  for (let index = 0; index < 4; index += 1) {
    const digit = randomInt(36);
    code += digit < 10 ? String(digit) : String.fromCharCode(87 + digit);
  }
  return `CS-${stamp}-${code.toUpperCase()}`;
}

/* Postgres raises a 23505 for a duplicate on a unique column. The order number
   has a four-character tie-break, so a collision here is unlikely — but a
   customer should never see a 500 because it happened. */
function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export class PrismaOrderRepository implements OrderRepository {
  /* Write the order in its unpaid state, with the stock still on the shelf and
     the bag still intact. The route attaches the Stripe session id next, then
     redirects the customer to Stripe; the webhook does the rest. */
  async createPendingOrder(accountId: string): Promise<CreatePendingOrderResult> {
    const bag = await cart.getCart(accountId);
    if (bag.lines.length === 0) {
      return { ok: false, reason: "empty" };
    }
    if (bag.hasUnavailable) {
      return { ok: false, reason: "unavailable" };
    }

    /* Snapshot the seller against each line. The bag only carries the product,
       so resolve ownership once here rather than trusting a later join. */
    const owners = await prisma.product.findMany({
      where: { id: { in: bag.lines.map((line) => line.productId) } },
      select: { id: true, sellerId: true },
    });
    const sellerByProduct = new Map(
      owners.map((product) => [product.id, product.sellerId] as const),
    );

    const items = bag.lines.map((line) => ({
      productId: line.productId,
      sellerId: sellerByProduct.get(line.productId) ?? null,
      slug: line.slug,
      brand: line.brand,
      model: line.model,
      reference: line.reference,
      dialId: line.selection.dialId,
      dialName: line.dialName,
      strapId: line.selection.strapId,
      strapName: line.strapName,
      sku: line.sku,
      unitPriceInCents: line.unitPriceInCents,
      quantity: line.quantity,
      imageUrl: line.imageUrl,
    }));

    /* One live checkout per account: an older unpaid session should not stay
       spendable alongside the new one. */
    await prisma.order.updateMany({
      where: { accountId, status: "awaiting_payment" },
      data: { status: "abandoned" },
    });

    for (let attempt = 0; ; attempt += 1) {
      try {
        const row = await prisma.order.create({
          data: {
            number: orderNumber(new Date()),
            accountId,
            status: "awaiting_payment",
            currency: bag.currency,
            subtotalInCents: bag.subtotalInCents,
            totalInCents: bag.subtotalInCents,
            items: { create: items },
          },
          include: orderInclude,
        });
        return { ok: true, order: toOrder(row) };
      } catch (error) {
        if (isUniqueViolation(error) && attempt < 5) {
          continue;
        }
        throw error;
      }
    }
  }

  async attachStripeSession(orderId: string, sessionId: string): Promise<void> {
    await prisma.order.updateMany({
      where: { id: orderId },
      data: { stripeSessionId: sessionId },
    });
  }

  /* Called by the Stripe webhook. Idempotent: a session that has already been
     paid returns the order unchanged, so a retried event cannot draw the stock
     down twice. */
  async markPaidBySessionId(sessionId: string): Promise<Order | null> {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { stripeSessionId: sessionId },
        include: orderInclude,
      });
      if (!order) {
        return null;
      }
      if (order.status === "paid") {
        return toOrder(order);
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: "paid", paidAt: new Date() },
        include: orderInclude,
      });

      await tx.cartItem.deleteMany({ where: { accountId: order.accountId } });

      /* Draw the stock down inside the same transaction as the order flip. A
         made-to-order reference has a NULL stock and is never decremented. */
      for (const item of updated.items) {
        await tx.$executeRaw`
          UPDATE "Product"
          SET "stock" = GREATEST("stock" - ${item.quantity}, 0)
          WHERE "id" = ${item.productId} AND "stock" IS NOT NULL
        `;
      }

      return toOrder(updated);
    });
  }

  async markAbandonedBySessionId(sessionId: string): Promise<void> {
    await prisma.order.updateMany({
      where: { stripeSessionId: sessionId, status: "awaiting_payment" },
      data: { status: "abandoned" },
    });
  }

  async getOrderForAccount(orderId: string, accountId: string): Promise<Order | null> {
    const row = await prisma.order.findFirst({
      where: { id: orderId, accountId },
      include: orderInclude,
    });
    return row ? toOrder(row) : null;
  }

  async listOrdersForAccount(accountId: string): Promise<Order[]> {
    const rows = await prisma.order.findMany({
      where: { accountId },
      include: orderInclude,
      orderBy: { placedAt: "desc" },
    });
    return rows.map(toOrder);
  }
}
