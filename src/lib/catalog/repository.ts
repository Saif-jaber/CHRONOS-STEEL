import "server-only";
import { randomUUID } from "node:crypto";
import { PrismaCatalogRepository } from "./prisma-repository";
import { PRODUCTS } from "./products";
import { buildProductFromListing, slugify, type NewListingInput } from "./listing";
import type { Product } from "../types";

export interface CatalogRepository {
  listProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductsByIds(ids: string[]): Promise<Product[]>;
  /** Facet counts for the command palette and the nav's browse menu. */
  listCollections(): Promise<Array<{ name: string; count: number }>>;
  getProductsBySellerId(sellerId: string): Promise<Product[]>;
  getProductsByStoreSlug(storeSlug: string): Promise<Product[]>;
  /** Persists a seller listing and returns it in catalogue shape. */
  createListing(input: NewListingInput): Promise<Product>;
  /** Flips one seller's own reference from draft to published; null if not theirs. */
  publishListing(id: string, sellerId: string): Promise<Product | null>;
}

/** Seed-array implementation; used by `prisma/seed.ts` and tests. */
export class SeedCatalogRepository implements CatalogRepository {
  async listProducts(): Promise<Product[]> {
    return PRODUCTS.filter((product) => product.published !== false);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    return PRODUCTS.find((product) => product.slug === slug) ?? null;
  }

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    const wanted = new Set(ids);
    return PRODUCTS.filter((product) => wanted.has(product.id));
  }

  async listCollections(): Promise<Array<{ name: string; count: number }>> {
    const counts = new Map<string, number>();
    for (const product of PRODUCTS) {
      if (product.published === false) continue;
      counts.set(product.collection, (counts.get(product.collection) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProductsBySellerId(sellerId: string): Promise<Product[]> {
    return PRODUCTS.filter((product) => product.sellerId === sellerId);
  }

  async getProductsByStoreSlug(storeSlug: string): Promise<Product[]> {
    return PRODUCTS.filter(
      (product) => product.storeSlug === storeSlug && product.published !== false,
    );
  }

  async createListing(input: NewListingInput): Promise<Product> {
    const taken = new Set(PRODUCTS.map((product) => product.slug));
    const base = slugify(`${input.brand} ${input.model} ${input.reference}`);
    let slug = base;
    for (let suffix = 2; taken.has(slug); suffix += 1) slug = `${base}-${suffix}`;

    const product = buildProductFromListing({
      id: `seed-${randomUUID()}`,
      slug,
      input,
    });
    PRODUCTS.push(product);
    return product;
  }

  async publishListing(id: string, sellerId: string): Promise<Product | null> {
    const product = PRODUCTS.find((entry) => entry.id === id && entry.sellerId === sellerId);
    if (!product) return null;
    product.published = true;
    return product;
  }
}

/** Live export, backed by Prisma. */
export const catalog: CatalogRepository = new PrismaCatalogRepository();
