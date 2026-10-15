import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PRODUCTS } from "../src/lib/catalog/products";

/**
 * Writes the seed catalogue into PostgreSQL.
 *
 * Run with `npm run db:seed` (Prisma 7 no longer runs it as a side effect of
 * migrating). It is idempotent: every product is an upsert keyed on its id, and
 * the option axes are replaced wholesale under it, so running it twice leaves the
 * same table rather than doubling it, and editing a dial in
 * `src/lib/catalog/products.ts` and re-running moves the change.
 *
 * This script builds its own client rather than importing `src/lib/prisma.ts`:
 * that module carries `server-only`, which exists to fail loudly in a React
 * bundle and has no business in a standalone Node script. Same adapter, same
 * connection string, one less condition to reason about.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const [index, product] of PRODUCTS.entries()) {
    const fields = {
      slug: product.slug,
      brand: product.brand,
      model: product.model,
      reference: product.reference,
      yearIntroduced: product.yearIntroduced,
      collection: product.collection,
      summary: product.summary,
      story: product.story,
      sortOrder: index,

      diameterMm: product.caseSpec.diameterMm,
      thicknessMm: product.caseSpec.thicknessMm,
      lugToLugMm: product.caseSpec.lugToLugMm,
      lugWidthMm: product.caseSpec.lugWidthMm,
      material: product.caseSpec.material,
      finish: product.caseSpec.finish,
      bezel: product.caseSpec.bezel,
      crystal: product.caseSpec.crystal,
      waterResistanceM: product.caseSpec.waterResistanceM,

      type: product.movement.type,
      caliber: product.movement.caliber,
      manufacturer: product.movement.manufacturer,
      powerReserveHours: product.movement.powerReserveHours,
      frequencyVph: product.movement.frequencyVph,
      jewels: product.movement.jewels,
      components: product.movement.components,
      chronometerDeviationPercent: product.movement.chronometerDeviationPercent,
      winding: product.movement.winding,

      indexStyle: product.indexStyle,
      lume: product.lume,
      signature: product.signature,
      sublabel: product.sublabel,
      basePriceInCents: product.basePriceInCents,
      currency: product.currency,
      stock: product.stock,
      reserved: product.reserved,
      editionSize: product.editionSize,
      featured: product.featured,
      tags: product.tags,
      published: true,
    };

    /* The option axes are expressed once as plain create inputs. `deleteMany`
       belongs to the *update* path only — a product being inserted for the
       first time has nothing to replace — so the two arms of the upsert share
       the scalars and differ only in that one key. */
    const dials = product.dials.map((dial, position) => ({
      id: dial.id,
      sortOrder: position,
      name: dial.name,
      colorName: dial.colorName,
      colorHex: dial.colorHex,
      finish: dial.finish,
      priceDeltaInCents: dial.priceDeltaInCents,
      complications: [...dial.complications],
      complicationPlacements: dial.complicationPlacements,
    }));

    const straps = product.straps.map((strap, position) => ({
      id: strap.id,
      sortOrder: position,
      type: strap.type,
      name: strap.name,
      material: strap.material,
      colorHex: strap.colorHex,
      colorName: strap.colorName,
      priceDeltaInCents: strap.priceDeltaInCents,
      widthMm: strap.widthMm,
      stitchColorHex: strap.stitchColorHex ?? null,
    }));

    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        ...fields,
        dials: { deleteMany: {}, create: dials },
        straps: { deleteMany: {}, create: straps },
      },
      create: { id: product.id, ...fields, dials: { create: dials }, straps: { create: straps } },
    });
  }

  const count = await prisma.product.count();
  const dials = await prisma.dial.count();
  const straps = await prisma.strap.count();
  console.log(
    `Catalogue seeded: ${count} products, ${dials} dials, ${straps} straps (from ${PRODUCTS.length} in the seed file).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
