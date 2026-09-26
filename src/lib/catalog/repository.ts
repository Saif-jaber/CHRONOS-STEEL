import "server-only";
import { PRODUCTS } from "./products";
import type { Product } from "../types";

/**
 * The catalogue seam.
 *
 * Every read in the app goes through this interface, and the only thing that
 * knows about Prisma is the `PrismaCatalogRepository` below. When you generate
 * `schema.prisma`, implement this interface against your client and swap the
 * export at the bottom of the file, the pages, the facet engine, the variant
 * manager and the renderer all stay untouched.
 *
 * Why an interface rather than a direct query: the collection page filters and
 * counts on the *server* so the first paint is already correct and shareable.
 * That logic needs the full product set, not a paginated page of it, which
 * means a `findMany` with an eager include rather than a REST call per facet.
 * Keeping the shape behind an interface makes that trade-off explicit.
 */

export interface CatalogRepository {
  listProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductsByIds(ids: string[]): Promise<Product[]>;
  /** Facet counts for the command palette and the nav's browse menu. */
  listCollections(): Promise<Array<{ name: string; count: number }>>;
}

class SeedCatalogRepository implements CatalogRepository {
  async listProducts(): Promise<Product[]> {
    return PRODUCTS;
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
      counts.set(product.collection, (counts.get(product.collection) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

/**
 * The live export. Swap this line to `new PrismaCatalogRepository(prisma)` and
 * nothing else in `src/` needs to change.
 */
export const catalog: CatalogRepository = new SeedCatalogRepository();

/* ── Reference implementation for your Prisma adapter ────────────────────
 *
 * Drop this into `lib/catalog/prisma-repository.ts` once `schema.prisma`
 * exists. Note the eager includes: facets and variant prices are computed from
 * the complete option set, so a partial load would silently break the counts.
 *
 *   import { prisma } from "@/lib/prisma";
 *
 *   const productInclude = {
 *     dials:    { orderBy: { sortOrder: "asc" } },
 *     straps:   { orderBy: { sortOrder: "asc" } },
 *     inventory: true,
 *   } satisfies Prisma.ProductInclude;
 *
 *   export class PrismaCatalogRepository implements CatalogRepository {
 *     async listProducts() {
 *       const rows = await prisma.product.findMany({
 *         include: productInclude,
 *         orderBy: [{ featured: "desc" }, { caseDiameterMm: "asc" }],
 *       });
 *       return rows.map(toProduct);
 *     }
 *
 *     async getProductBySlug(slug: string) {
 *       const row = await prisma.product.findUnique({
 *         where: { slug },
 *         include: productInclude,
 *       });
 *       return row ? toProduct(row) : null;
 *     }
 *
 *     async getProductsByIds(ids: string[]) {
 *       const rows = await prisma.product.findMany({
 *         where: { id: { in: ids } },
 *         include: productInclude,
 *       });
 *       return rows.map(toProduct);
 *     }
 *
 *     async listCollections() {
 *       const groups = await prisma.product.groupBy({
 *         by: ["collection"],
 *         _count: { _all: true },
 *       });
 *       return groups
 *         .map((g) => ({ name: g.collection, count: g._count._all }))
 *         .sort((a, b) => a.name.localeCompare(b.name));
 *     }
 *   }
 *
 * `toProduct` is where your Prisma row becomes the `Product` shape above.
 * Keep the field names identical and it is a mechanical mapping.
 */
