import "server-only";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { cart } from "@/lib/cart/repository";
import { STOREFRONT_CURRENCY } from "@/lib/format";
import type { Currency, Order, OrderLine } from "@/lib/types";
import type { OrderRepository, PlaceOrderResult } from "./repository";

/** Postgres order adapter: read the bag, refuse it if empty or unshippable, then write the order and clear the bag in one transaction. */

/* Crockford-ish alphabet: no I, O, 0 or 1, so a code read aloud or typed back is unambiguous. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function code(length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

function orderNumber(now: Date): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `CS-${y}${m}${d}-${code(4)}`;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

type OrderRow = {
  id: string;
  number: string;
  status: string;
  currency: string;
  subtotalInCents: number;
  totalInCents: number;
  placedAt: Date;
  items: Array<{
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
  }>;
};

function toOrder(row: OrderRow): Order {
  const lines: OrderLine[] = row.items.map((item) => ({
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
  }));
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    currency: row.currency as Currency,
    subtotalInCents: row.subtotalInCents,
    totalInCents: row.totalInCents,
    placedAt: row.placedAt.toISOString(),
    lines,
  };
}

const orderInclude = {
  items: { orderBy: { id: "asc" as const } },
} satisfies object;

export class PrismaOrderRepository implements OrderRepository {
  async placeOrder(accountId: string): Promise<PlaceOrderResult> {
    const bag = await cart.getCart(accountId);
    if (bag.lines.length === 0) return { ok: false, reason: "empty" };
    if (bag.hasUnavailable) return { ok: false, reason: "unavailable" };

    const currency = bag.currency ?? STOREFRONT_CURRENCY;
    const subtotal = bag.subtotalInCents;
    const items = bag.lines.map((line) => ({
      productId: line.productId,
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

    /* Reorder at the same second is the only collision path; a fresh code resolves it. */
    for (let attempt = 0; ; attempt += 1) {
      try {
        const row = await prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              number: orderNumber(new Date()),
              accountId,
              status: "placed",
              currency,
              subtotalInCents: subtotal,
              /* No shipping or tax model yet; the total is the subtotal until one exists. */
              totalInCents: subtotal,
              items: { create: items },
            },
            include: orderInclude,
          });
          await tx.cartItem.deleteMany({ where: { accountId } });
          return order;
        });
        return { ok: true, order: toOrder(row) };
      } catch (error) {
        if (isUniqueViolation(error) && attempt < 5) continue;
        throw error;
      }
    }
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
