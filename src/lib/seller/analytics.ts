import "server-only";
import { prisma } from "@/lib/prisma";
import { STOREFRONT_CURRENCY } from "@/lib/format";
import type { Currency } from "@/lib/types";

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 30;

export interface SellerDayPoint {
  key: string;
  label: string;
  revenueInCents: number;
  orders: number;
  units: number;
}

export interface SellerMetric {
  value: number;
  previous: number;
  changePercent: number | null;
}

export interface SellerListingPerformance {
  id: string | null;
  slug: string;
  brand: string;
  model: string;
  reference: string;
  imageUrl: string | null;
  published: boolean;
  stock: number | null;
  units: number;
  revenueInCents: number;
  lastSoldAt: string | null;
  delisted: boolean;
}

export interface SellerRecentSale {
  id: string;
  number: string;
  paidAt: string;
  buyerName: string;
  units: number;
  totalInCents: number;
  lines: Array<{
    productId: string | null;
    slug: string;
    brand: string;
    model: string;
    quantity: number;
    unitPriceInCents: number;
    imageUrl: string | null;
  }>;
}

export interface SellerDashboard {
  currency: Currency;
  period: { start: string; end: string; days: number };
  metrics: {
    revenue: SellerMetric;
    orders: SellerMetric;
    units: SellerMetric;
    averageOrder: SellerMetric;
    addedToBag: SellerMetric;
  };
  lifetime: {
    revenueInCents: number;
    orders: number;
    units: number;
    averageOrderInCents: number;
    firstSaleAt: string | null;
  };
  series: SellerDayPoint[];
  listings: SellerListingPerformance[];
  recentSales: SellerRecentSale[];
  counts: {
    total: number;
    published: number;
    drafts: number;
    outOfStock: number;
    lowStock: number;
  };
}

interface ListingStat {
  units: number;
  revenueInCents: number;
  lastSoldAt: string | null;
  brand: string;
  model: string;
  reference: string;
  slug: string;
  imageUrl: string | null;
}

function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function average(totalInCents: number, orders: number): number {
  return orders === 0 ? 0 : Math.round(totalInCents / orders);
}

export async function getSellerDashboard(
  sellerId: string,
  now: Date = new Date(),
): Promise<SellerDashboard> {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const windowStart = today - (WINDOW_DAYS - 1) * DAY_MS;
  const windowEnd = today + DAY_MS;
  const previousStart = windowStart - WINDOW_DAYS * DAY_MS;

  const [products, orders, bagEvents] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId },
      select: {
        id: true,
        slug: true,
        brand: true,
        model: true,
        reference: true,
        images: true,
        stock: true,
        published: true,
      },
    }),
    prisma.order.findMany({
      where: { status: "paid", items: { some: { sellerId } } },
      select: {
        id: true,
        number: true,
        currency: true,
        placedAt: true,
        paidAt: true,
        account: { select: { name: true } },
        items: {
          where: { sellerId },
          select: {
            productId: true,
            slug: true,
            brand: true,
            model: true,
            reference: true,
            unitPriceInCents: true,
            quantity: true,
            imageUrl: true,
          },
        },
      },
      orderBy: [{ paidAt: "desc" }, { placedAt: "desc" }],
    }),
    prisma.sellerEvent.findMany({
      where: {
        sellerId,
        type: "add_to_bag",
        createdAt: { gte: new Date(previousStart), lt: new Date(windowEnd) },
      },
      select: { createdAt: true },
    }),
  ]);

  const currentBagAdds = bagEvents.filter(
    (event) => event.createdAt.getTime() >= windowStart,
  ).length;
  const previousBagAdds = bagEvents.length - currentBagAdds;

  const series: SellerDayPoint[] = Array.from({ length: WINDOW_DAYS }, (_, index) => {
    const date = new Date(windowStart + index * DAY_MS);
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
      revenueInCents: 0,
      orders: 0,
      units: 0,
    };
  });
  const byDay = new Map(series.map((point) => [point.key, point]));

  const current = { revenueInCents: 0, orders: 0, units: 0 };
  const previous = { revenueInCents: 0, orders: 0, units: 0 };
  const lifetime = {
    revenueInCents: 0,
    orders: 0,
    units: 0,
    firstSaleAt: null as string | null,
  };
  const listingStats = new Map<string, ListingStat>();

  for (const order of orders) {
    const at = order.paidAt ?? order.placedAt;
    const atMs = at.getTime();
    const revenueInCents = order.items.reduce(
      (sum, item) => sum + item.unitPriceInCents * item.quantity,
      0,
    );
    const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const atIso = at.toISOString();

    lifetime.revenueInCents += revenueInCents;
    lifetime.orders += 1;
    lifetime.units += units;
    if (!lifetime.firstSaleAt || atIso < lifetime.firstSaleAt) {
      lifetime.firstSaleAt = atIso;
    }

    if (atMs >= windowStart && atMs < windowEnd) {
      current.revenueInCents += revenueInCents;
      current.orders += 1;
      current.units += units;

      const point = byDay.get(atIso.slice(0, 10));
      if (point) {
        point.revenueInCents += revenueInCents;
        point.orders += 1;
        point.units += units;
      }
    } else if (atMs >= previousStart && atMs < windowStart) {
      previous.revenueInCents += revenueInCents;
      previous.orders += 1;
      previous.units += units;
    }

    for (const item of order.items) {
      const key = item.productId ?? `slug:${item.slug}`;
      const stat = listingStats.get(key) ?? {
        units: 0,
        revenueInCents: 0,
        lastSoldAt: null,
        brand: item.brand,
        model: item.model,
        reference: item.reference,
        slug: item.slug,
        imageUrl: item.imageUrl,
      };
      stat.units += item.quantity;
      stat.revenueInCents += item.unitPriceInCents * item.quantity;
      if (!stat.lastSoldAt || atIso > stat.lastSoldAt) stat.lastSoldAt = atIso;
      listingStats.set(key, stat);
    }
  }

  const known = new Set(products.map((product) => product.id));
  const listings: SellerListingPerformance[] = products.map((product) => {
    const stat = listingStats.get(product.id);
    return {
      id: product.id,
      slug: product.slug,
      brand: product.brand,
      model: product.model,
      reference: product.reference,
      imageUrl: product.images[0] ?? null,
      published: product.published,
      stock: product.stock,
      units: stat?.units ?? 0,
      revenueInCents: stat?.revenueInCents ?? 0,
      lastSoldAt: stat?.lastSoldAt ?? null,
      delisted: false,
    };
  });

  for (const [key, stat] of listingStats) {
    if (known.has(key)) continue;
    listings.push({
      id: null,
      slug: stat.slug,
      brand: stat.brand,
      model: stat.model,
      reference: stat.reference,
      imageUrl: stat.imageUrl,
      published: false,
      stock: null,
      units: stat.units,
      revenueInCents: stat.revenueInCents,
      lastSoldAt: stat.lastSoldAt,
      delisted: true,
    });
  }

  listings.sort(
    (a, b) =>
      b.revenueInCents - a.revenueInCents ||
      b.units - a.units ||
      a.model.localeCompare(b.model),
  );

  const recentSales: SellerRecentSale[] = orders.slice(0, 6).map((order) => ({
    id: order.id,
    number: order.number,
    paidAt: (order.paidAt ?? order.placedAt).toISOString(),
    buyerName: order.account.name,
    units: order.items.reduce((sum, item) => sum + item.quantity, 0),
    totalInCents: order.items.reduce(
      (sum, item) => sum + item.unitPriceInCents * item.quantity,
      0,
    ),
    lines: order.items.map((item) => ({
      productId: item.productId,
      slug: item.slug,
      brand: item.brand,
      model: item.model,
      quantity: item.quantity,
      unitPriceInCents: item.unitPriceInCents,
      imageUrl: item.imageUrl,
    })),
  }));

  const currentAverage = average(current.revenueInCents, current.orders);
  const previousAverage = average(previous.revenueInCents, previous.orders);

  return {
    currency: (orders[0]?.currency as Currency) ?? STOREFRONT_CURRENCY,
    period: {
      start: new Date(windowStart).toISOString(),
      end: new Date(today).toISOString(),
      days: WINDOW_DAYS,
    },
    metrics: {
      revenue: {
        value: current.revenueInCents,
        previous: previous.revenueInCents,
        changePercent: changePercent(current.revenueInCents, previous.revenueInCents),
      },
      orders: {
        value: current.orders,
        previous: previous.orders,
        changePercent: changePercent(current.orders, previous.orders),
      },
      units: {
        value: current.units,
        previous: previous.units,
        changePercent: changePercent(current.units, previous.units),
      },
      averageOrder: {
        value: currentAverage,
        previous: previousAverage,
        changePercent: changePercent(currentAverage, previousAverage),
      },
      addedToBag: {
        value: currentBagAdds,
        previous: previousBagAdds,
        changePercent: changePercent(currentBagAdds, previousBagAdds),
      },
    },
    lifetime: {
      ...lifetime,
      averageOrderInCents: average(lifetime.revenueInCents, lifetime.orders),
    },
    series,
    listings,
    recentSales,
    counts: {
      total: products.length,
      published: products.filter((product) => product.published).length,
      drafts: products.filter((product) => !product.published).length,
      outOfStock: products.filter((product) => product.stock === 0).length,
      lowStock: products.filter(
        (product) => product.stock !== null && product.stock > 0 && product.stock <= 2,
      ).length,
    },
  };
}
