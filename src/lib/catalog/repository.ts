import "server-only";
import { PrismaCatalogRepository } from "./prisma-repository";
import type { NewListingInput } from "./listing";
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

/** Live export, backed by Prisma. */
export const catalog: CatalogRepository = new PrismaCatalogRepository();
