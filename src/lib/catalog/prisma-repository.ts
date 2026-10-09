import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type {
  CaseSpec,
  Complication,
  ComplicationPlacement,
  DialOption,
  IndexStyle,
  Movement,
  MovementType,
  Product,
  StrapOption,
} from "../types";
import type { CatalogRepository } from "./repository";

/**
 * The Postgres implementation of the catalogue seam.
 *
 * Two rules hold it together:
 *
 * - Every read includes the option axes. The facet engine, the price ladder and
 *   the renderer all compute from the *complete* dial and strap sets, so a
 *   partial load would silently wrong the counts rather than fail loudly. The
 *   include lives in one constant rather than being repeated per query, because
 *   the fourth method that forgets it is the one that ships.
 * - `toProduct` is name-for-name. The schema flattened `caseSpec` and `movement`
 *   into columns of the same names precisely so this mapping has no decisions
 *   in it; the casts are the union types from `lib/types.ts` asserting
 *   themselves over a `String` column, which is the trade the schema comment
 *   already declared.
 *
 * `inventory` is deliberately not read: stock still lives on the product row and
 * is resolved at variant time by `lib/catalog/variants.ts`. The table exists for
 * the day per-variant stock is switched on, and the day that happens this is the
 * only file that changes.
 */

const productInclude = {
  dials: { orderBy: { sortOrder: "asc" as const } },
  straps: { orderBy: { sortOrder: "asc" as const } },
  seller: { select: { storeSlug: true, storeName: true, id: true } },
} satisfies object;

/** A product row *as the queries above return it*: scalars plus both option
    axes. The bare model type deliberately has no relations on it, which is why
    every mapping function below takes this, not `Product` from the client. */
type ProductRow = Prisma.ProductGetPayload<{ include: { dials: true; straps: true; seller: { select: { storeSlug: true; storeName: true; id: true } } } }>;

function toDial(row: ProductRow["dials"][number]): DialOption {
  return {
    id: row.id,
    name: row.name,
    colorName: row.colorName,
    colorHex: row.colorHex,
    finish: row.finish as DialOption["finish"],
    priceDeltaInCents: row.priceDeltaInCents,
    complications: row.complications as Complication[],
    complicationPlacements: row.complicationPlacements as Partial<
      Record<Complication, ComplicationPlacement>
    >,
  };
}

function toStrap(row: ProductRow["straps"][number]): StrapOption {
  return {
    id: row.id,
    type: row.type as StrapOption["type"],
    name: row.name,
    material: row.material,
    colorHex: row.colorHex,
    colorName: row.colorName,
    priceDeltaInCents: row.priceDeltaInCents,
    widthMm: row.widthMm,
    stitchColorHex: row.stitchColorHex ?? undefined,
  };
}

function toCaseSpec(row: ProductRow): CaseSpec {
  return {
    diameterMm: row.diameterMm,
    thicknessMm: row.thicknessMm,
    lugToLugMm: row.lugToLugMm,
    lugWidthMm: row.lugWidthMm,
    material: row.material as CaseSpec["material"],
    finish: row.finish as CaseSpec["finish"],
    bezel: row.bezel as CaseSpec["bezel"],
    crystal: row.crystal as CaseSpec["crystal"],
    waterResistanceM: row.waterResistanceM,
  };
}

function toMovement(row: ProductRow): Movement {
  return {
    type: row.type as MovementType,
    caliber: row.caliber,
    manufacturer: row.manufacturer,
    powerReserveHours: row.powerReserveHours,
    frequencyVph: row.frequencyVph,
    jewels: row.jewels,
    components: row.components,
    chronometerDeviationPercent: row.chronometerDeviationPercent,
    winding: row.winding as Movement["winding"],
  };
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    reference: row.reference,
    yearIntroduced: row.yearIntroduced,
    collection: row.collection,
    summary: row.summary,
    story: row.story,
    caseSpec: toCaseSpec(row),
    movement: toMovement(row),
    dials: row.dials.map(toDial),
    straps: row.straps.map(toStrap),
    indexStyle: row.indexStyle as IndexStyle,
    lume: row.lume,
    signature: row.signature,
    sublabel: row.sublabel,
    basePriceInCents: row.basePriceInCents,
    currency: row.currency as Product["currency"],
    stock: row.stock,
    reserved: row.reserved,
    editionSize: row.editionSize,
    featured: row.featured,
    tags: row.tags,
    sellerId: row.sellerId ?? null,
    storeName: row.seller?.storeName ?? undefined,
    storeSlug: row.seller?.storeSlug ?? undefined,
  };
}

export class PrismaCatalogRepository implements CatalogRepository {
  async listProducts(): Promise<Product[]> {
    const rows = await prisma.product.findMany({
      include: productInclude,
      orderBy: [{ sortOrder: "asc" }, { yearIntroduced: "asc" }],
    });
    return rows.map(toProduct);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const row = await prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    return row ? toProduct(row) : null;
  }

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    const rows = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: productInclude,
      orderBy: [{ sortOrder: "asc" }, { yearIntroduced: "asc" }],
    });
    return rows.map(toProduct);
  }

  async listCollections(): Promise<Array<{ name: string; count: number }>> {
    const groups = await prisma.product.groupBy({
      by: ["collection"],
      _count: { _all: true },
    });
    return groups
      .map((group) => ({ name: group.collection, count: group._count._all }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProductsBySellerId(sellerId: string): Promise<Product[]> {
    const rows = await prisma.product.findMany({
      where: { sellerId },
      include: productInclude,
      orderBy: [{ sortOrder: "asc" }, { yearIntroduced: "asc" }],
    });
    return rows.map(toProduct);
  }

  async getProductsByStoreSlug(storeSlug: string): Promise<Product[]> {
    const rows = await prisma.product.findMany({
      where: { seller: { storeSlug } },
      include: productInclude,
      orderBy: [{ sortOrder: "asc" }, { yearIntroduced: "asc" }],
    });
    return rows.map(toProduct);
  }
}
